// src/features/mypage/utils/tradeStatus.ts
import type { TradeItem, TradeStatus } from "../types/trade";

/* =========================
 *   Helpers
 * ========================= */

const U = (v?: string | null) => (v ?? "").toString().trim().toUpperCase();

const ENDED_KEYWORDS = new Set([
  // 일반 종료/완료
  "FINISH",
  "FINISHED",
  "COMPLETED",
  "DONE",
  "ENDED",
  "CLOSED",
  // 취소/실패도 종료 취급
  "CANCEL",
  "CANCELED",
  "CANCELLED",
  "FAIL",
  "FAILED",
  // 결제/정산/입금 완료
  "PAID",
  "PAY_DONE",
  "DEPOSIT_DONE",
  "SETTLED",
  "SETTLEMENT_DONE",
  "PAYOUT_DONE",
  // 결과 성공도 종료
  "SUCCESS",
]);

/** 백엔드에서 내려올 수 있는 결제/정산 관련 보조 필드 */
type PaymentLike = {
  paymentStatus?: string | null;
  settlementStatus?: string | null;
  payStatus?: string | null;
  depositStatus?: string | null;
  resultStatus?: string | null;
  paid?: boolean | null;
  isPaid?: boolean | null;
  paymentDone?: boolean | null;
};

function parseMs(iso?: string | null) {
  if (!iso) return NaN;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : NaN;
}

/* =========================
 *   Primitive status checks
 * ========================= */

/** 진행 상태 판단 (옵션: BEFORE를 진행으로 볼지 여부) */
export function isOngoingStatus(
  status: TradeStatus,
  opts: { treatBeforeAsOngoing?: boolean } = { treatBeforeAsOngoing: true }
) {
  const { treatBeforeAsOngoing = true } = opts;
  return (
    status === "SALE" ||
    status === "PROGRESS" ||
    (treatBeforeAsOngoing && status === "BEFORE")
  );
}

export function isEndedStatus(status: TradeStatus) {
  return status === "FINISH" || status === "COMPLETED";
}

/** 종료시간이 과거면 종료 */
export const isEndedByTime = (endAt?: string): boolean => {
  const t = parseMs(endAt);
  return Number.isFinite(t) ? t <= Date.now() : false;
};

/** 결제/정산/결과 플래그로 종료인지 판별 */
export function isEndedByPaymentLike(p?: PaymentLike | null | undefined) {
  if (!p) return false;
  if (p.paid || p.isPaid || p.paymentDone) return true;

  const buckets = [
    U(p.paymentStatus),
    U(p.settlementStatus),
    U(p.payStatus),
    U(p.depositStatus),
    U(p.resultStatus),
  ];
  return buckets.some((x) => x && ENDED_KEYWORDS.has(x));
}

/* =========================
 *   Effective status (시간+결제 반영)
 * ========================= */

/**
 * 시간/결제까지 고려한 "실효 상태" 도출
 * - COMPLETED는 항상 우선
 * - 결제/정산 완료 or 결과 성공이면 FINISH 강제
 * - 종료 시간이 지났다면 FINISH 강제
 * - 그 외에는 원래 status 유지
 */
export function deriveEffectiveStatus<
  T extends Pick<TradeItem, "status" | "auctionEnd"> & Partial<PaymentLike>,
>(item: T): TradeStatus {
  if (item.status === "COMPLETED") return "COMPLETED";
  if (isEndedByPaymentLike(item)) return "FINISH";
  if (isEndedByTime(item.auctionEnd)) return "FINISH";
  return item.status;
}

/* =========================
 *   Item-level helpers
 * ========================= */

/**
 * 아이템 진행 여부 (상태+종료시간+결제 고려)
 * 기본값: BEFORE를 진행으로 취급
 */
export function isOngoing<
  T extends Pick<TradeItem, "status" | "auctionEnd"> & Partial<PaymentLike>,
>(
  item: T,
  opts: { treatBeforeAsOngoing?: boolean } = { treatBeforeAsOngoing: true }
) {
  const eff = deriveEffectiveStatus(item);
  if (isEndedStatus(eff)) return false;
  return isOngoingStatus(eff, opts);
}

/** 아이템 종료 여부 (상태+종료시간+결제 고려) */
export function isEnded<
  T extends Pick<TradeItem, "status" | "auctionEnd"> & Partial<PaymentLike>,
>(item: T) {
  const eff = deriveEffectiveStatus(item);
  return eff === "FINISH" || eff === "COMPLETED";
}

/* =========================
 *   Sorting (공통 정렬)
 * ========================= */

/**
 * 진행군 우선 → 종료군 뒤로
 * 진행군 내부: SALE(0) → PROGRESS(1) → BEFORE(2)
 * 종료군 내부: FINISH(3) → COMPLETED(4)
 * UNKNOWN/미정 상태는 가장 뒤 (기본 rank 99)
 * 같은 군이면 종료시각 내림차순(최근 종료가 위)
 */

// 상태 우선순위(필요 키만 채워도 됨)
const ORDER: Partial<Record<TradeStatus, number>> = {
  SALE: 0,
  PROGRESS: 1,
  BEFORE: 2,
  FINISH: 3,
  COMPLETED: 4,
  // UNKNOWN은 생략 가능 ➜ 기본값 99로 처리
};

// 기본 Rank: ORDER에 없으면 큰 값(=가장 뒤)
const rank = (s: TradeStatus) => ORDER[s] ?? 99;

export function compareTradeItems<
  T extends Pick<TradeItem, "status" | "auctionEnd"> & Partial<PaymentLike>,
>(a: T, b: T): number {
  const ea = deriveEffectiveStatus(a);
  const eb = deriveEffectiveStatus(b);

  // 1) 상태 우선순위
  const so = rank(ea) - rank(eb);
  if (so !== 0) return so;

  // 2) 종료 시간 비교 (최근 종료가 위)
  const ta = parseMs(a.auctionEnd) || 0;
  const tb = parseMs(b.auctionEnd) || 0;
  return tb - ta;
}
