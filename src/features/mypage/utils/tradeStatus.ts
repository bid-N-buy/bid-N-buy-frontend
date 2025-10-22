// src/features/mypage/utils/tradeStatus.ts
import type { TradeItem, TradeStatus } from "../types/trade";

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
  if (!endAt) return false;
  const t = new Date(endAt).getTime();
  return Number.isFinite(t) ? t <= Date.now() : false;
};

/* =========================
 *   Effective status (시간 반영)
 * ========================= */

/**
 * 시간까지 고려한 "실효 상태" 도출
 * - COMPLETED는 항상 우선
 * - 종료 시간이 지났다면 FINISH로 강제
 * - 그 외에는 원래 status 유지
 */
export function deriveEffectiveStatus(
  item: Pick<TradeItem, "status" | "auctionEnd">
): TradeStatus {
  if (item.status === "COMPLETED") return "COMPLETED";
  if (isEndedByTime(item.auctionEnd)) return "FINISH";
  return item.status;
}

/* =========================
 *   Item-level helpers
 * ========================= */

/**
 * 아이템 진행 여부 (상태+종료시간 고려)
 * 기본값: BEFORE를 진행으로 취급 (판매 탭 등)
 * 구매 탭에서 BEFORE를 빼고 싶으면
 *   isOngoing(item, { treatBeforeAsOngoing: false })
 */
export function isOngoing(
  item: Pick<TradeItem, "status" | "auctionEnd">,
  opts: { treatBeforeAsOngoing?: boolean } = { treatBeforeAsOngoing: true }
) {
  if (isEndedByTime(item.auctionEnd)) return false;
  const eff = deriveEffectiveStatus(item);
  return isOngoingStatus(eff, opts);
}

/** 아이템 종료 여부 (상태+종료시간 고려) */
export function isEnded(item: Pick<TradeItem, "status" | "auctionEnd">) {
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
 * 같은 군이면 종료시각 내림차순(최근 종료가 위)
 */
export function compareTradeItems(a: TradeItem, b: TradeItem): number {
  const ea = deriveEffectiveStatus(a);
  const eb = deriveEffectiveStatus(b);

  const ORDER: Record<TradeStatus, number> = {
    SALE: 0,
    PROGRESS: 1,
    BEFORE: 2,
    FINISH: 3,
    COMPLETED: 4,
  };

  const so = ORDER[ea] - ORDER[eb];
  if (so !== 0) return so;

  const ta = a.auctionEnd ? new Date(a.auctionEnd).getTime() : 0;
  const tb = b.auctionEnd ? new Date(b.auctionEnd).getTime() : 0;
  return tb - ta;
}
