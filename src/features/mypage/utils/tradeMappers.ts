import type { TradeItem, TradeStatus } from "../types/trade";
import { toStatus, toKoreanStatusLabel } from "./statusLabel";
import { isEndedByTime } from "./tradeStatus";

/* =========================
 * 화면용 기본 라벨 (fallback)
 * ========================= */
export const STATUS_LABEL: Record<TradeStatus, string> = {
  BEFORE: "시작 전",
  SALE: "판매 중",
  PROGRESS: "진행 중",
  COMPLETED: "거래 완료",
  FINISH: "종료",
  UNKNOWN: "상태 미정",
};

/* =========================
 * 시간/상태 보조 유틸
 * ========================= */

// 경매 시작 전인지
function isBeforeStart(startAt?: string): boolean {
  if (!startAt) return false;
  const t = new Date(startAt).getTime();
  if (!Number.isFinite(t)) return false;
  return t > Date.now();
}

// 시작까지 남은 시간 라벨
function timeUntilLabel(startAt?: string): string {
  if (!startAt) return "";
  const startMs = new Date(startAt).getTime();
  if (!Number.isFinite(startMs)) return "";
  const diff = startMs - Date.now();
  if (diff <= 0) return "";
  const totalMin = Math.floor(diff / 60000);
  if (totalMin < 60) {
    return `${totalMin}분 남음`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}시간 ${m}분 남음`;
}

// 마감까지 남은 시간 라벨
function timeLeftLabel(endAt?: string): string {
  if (!endAt) return "";
  const endMs = new Date(endAt).getTime();
  if (!Number.isFinite(endMs)) return "";
  const diff = endMs - Date.now();
  if (diff <= 0) return "종료";
  const totalMin = Math.floor(diff / 60000);
  if (totalMin < 60) {
    return `${totalMin}분 남음`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}시간 ${m}분 남음`;
}

/**
 * 서버 status 문자열 + 시간 정보 → UI용 status/statusText
 */
function normalizeStatusForUi(
  rawStatusEnum: string,
  baseLabel: string | undefined,
  auctionStart?: string,
  auctionEnd?: string
): { finalStatus: TradeItem["status"]; finalText: string } {
  let finalStatus = rawStatusEnum as TradeItem["status"];

  // 1) 아직 시작 전
  if (isBeforeStart(auctionStart)) {
    finalStatus = "BEFORE";
    const until = timeUntilLabel(auctionStart);
    const finalText = until ? `시작 전 · ${until}` : "시작 전";
    return { finalStatus, finalText };
  }

  // 2) 이미 시간상 끝났음
  if (isEndedByTime(auctionEnd)) {
    if (finalStatus === "COMPLETED") {
      // 서버가 이미 '거래 완료' 같은 상태라면 그대로
      return { finalStatus: "COMPLETED", finalText: "거래 완료" };
    }
    // 단순히 경매 마감이라면 FINISH
    return { finalStatus: "FINISH", finalText: "종료" };
  }

  // 3) 진행 중일 때 남은 시간 붙이기
  if (finalStatus === "SALE" || finalStatus === "PROGRESS") {
    const left = timeLeftLabel(auctionEnd);
    if (left && left !== "종료") {
      const label = baseLabel?.trim() || "진행 중";
      return { finalStatus, finalText: `${label} · ${left}` };
    }
  }

  // 4) 기본 fallback
  const fallbackLabel =
    baseLabel?.trim() ||
    (finalStatus === "COMPLETED"
      ? "거래 완료"
      : finalStatus === "BEFORE"
        ? "시작 전"
        : finalStatus === "SALE"
          ? "판매 중"
          : finalStatus === "PROGRESS"
            ? "진행 중"
            : "종료");

  return { finalStatus, finalText: fallbackLabel };
}

/* =========================
 * 공통 pick 유틸
 * ========================= */

function pickThumbUrl(src: any): string | null {
  return (
    src.itemImageUrl ??
    src.mainImageUrl ??
    src.thumbnail ??
    src.thumbnailUrl ??
    src.image ??
    src.imageUrl ??
    null
  );
}

function pickAuctionStart(res: any): string | undefined {
  return res.startAt ?? res.startTime ?? res.auctionStart ?? undefined;
}

function pickAuctionEnd(res: any): string | undefined {
  // ✅ endDate도 후보에 포함 (페이지 정렬에서 endDate를 참조하는 경우 대비)
  return (
    res.endTime ??
    res.endAt ??
    res.endedAt ??
    res.closeAt ??
    res.endDate ??
    undefined
  );
}

// 가격: 없으면 undefined 유지
function pickPrice(res: any): number | undefined {
  const raw =
    res.finalPrice ??
    res.price ??
    res.bidPrice ??
    res.currentPrice ??
    res.myBidPrice ??
    undefined;

  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/* =========================
 * 내부 헬퍼: 상태 문자열 가공
 * ========================= */

/**
 * 구매자 관점에서 보기 좋게 상태 문자열을 정제한다.
 * - 이미 '완료'류면 그대로
 * - '결제~'인데 정산 언급 없으면 '정산중'
 */
function massagePurchaseStatusText(raw: string): string {
  const text = raw?.toString()?.trim() ?? "";

  // 완료류(공백 유무 모두 허용)
  if (
    text.includes("정산 완료") ||
    text.includes("정산완료") ||
    text.includes("거래 완료") ||
    text.includes("거래완료") ||
    text.includes("완료")
  ) {
    return text;
  }

  if (text.includes("결제")) {
    return "정산중";
  }

  return text || "상태정보없음";
}

/* =========================
 * 내부 헬퍼: 결제완료 시각/플래그 추출
 * ========================= */

function pickPaidAt(res: any): string | undefined {
  return (
    res.paidAt ??
    res.paymentAt ??
    res.depositAt ??
    res.settlementAt ??
    res.payoutAt ??
    res.resultAt ??
    res.orderCompletedAt ??
    res.completedAt ??
    res.updatedAt ?? // 완료 시각을 updatedAt에만 실는 케이스
    undefined
  );
}

function pickPaidFlags(res: any) {
  return {
    paid: res.paid ?? undefined,
    isPaid: res.isPaid ?? undefined,
    paymentDone: res.paymentDone ?? undefined,
    paymentStatus: res.paymentStatus ?? res.payStatus ?? undefined,
    settlementStatus: res.settlementStatus ?? undefined,
    depositStatus: res.depositStatus ?? undefined,
    resultStatus: res.resultStatus ?? undefined,
  };
}

/* =========================
 * 내부 헬퍼: settled 판별
 * ========================= */
/**
 * 이 거래가 "이미 구매확정/정산까지 끝난 상태냐?" 를 boolean으로 리턴.
 */
function computeSettled(
  res: any,
  finalStatus: TradeItem["status"],
  finalText: string
): boolean {
  if (res.settled === true) return true;
  if (res.isSettled === true) return true;
  if (res.confirmed === true) return true;

  if (finalStatus === "COMPLETED") return true;

  const txt = (finalText || "").toString();
  if (
    txt.includes("거래 완료") ||
    txt.includes("거래완료") ||
    txt.includes("정산 완료") ||
    txt.includes("정산완료")
  ) {
    return true;
  }
  return false;
}

/* =========================
 * 매퍼들
 * ========================= */

export function fromPurchase(res: any): TradeItem {
  const rawId =
    res.auctionId ??
    res.id ??
    res.auction_id ??
    res.auctionID ??
    res.itemId ??
    0;

  const title = res.title ?? res.itemName ?? res.auctionTitle ?? "제목 없음";

  const thumbUrl = pickThumbUrl(res);
  const price = pickPrice(res);

  // 1. 서버 원본 상태 문자열
  const rawStatusText =
    res.statusText ?? res.status_desc ?? res.sellingStatus ?? res.status ?? "";

  // 2. UI 친화적으로 정제 ("결제~" -> "정산중", 등)
  const adjustedStatusText = massagePurchaseStatusText(rawStatusText);

  // 3. enum/label 파생
  const baseLabel = toKoreanStatusLabel(adjustedStatusText);
  const statusEnum = toStatus(adjustedStatusText);

  const auctionStart = pickAuctionStart(res);
  const auctionEnd = pickAuctionEnd(res);

  // 4. 최종 status / statusText
  const { finalStatus, finalText } = normalizeStatusForUi(
    statusEnum,
    baseLabel,
    auctionStart,
    auctionEnd
  );

  const counterparty =
    res.sellerNickname ??
    res.sellerName ??
    res.seller ??
    res.counterparty ??
    undefined;

  // 5. 이 거래가 이미 끝난 거래인지(버튼 숨길지) 계산
  const settled = computeSettled(res, finalStatus, finalText);

  // 6. 결제완료 시각/플래그 표준화
  const paidAt = pickPaidAt(res);
  const paidLike = pickPaidFlags(res);

  const core = {
    id: String(rawId),
    orderId:
      res.orderId ??
      res.settlementId ??
      res.purchaseId ??
      res.auctionId ??
      rawId ??
      null,
    title,
    thumbUrl: thumbUrl ?? undefined,
    price,
    status: finalStatus,
    statusText: finalText || adjustedStatusText || "상태정보없음",
    counterparty,
    auctionStart,
    auctionEnd,
    settled,
  };

  // TradeItem 타입에 없는 키(paidAt 등)를 함께 실어 보내 정렬이 정확히 되도록 한다.
  return { ...(core as any), paidAt, ...paidLike } as unknown as TradeItem;
}

export function fromSale(res: any): TradeItem {
  const rawId =
    res.auctionId ??
    res.id ??
    res.auction_id ??
    res.auctionID ??
    res.itemId ??
    0;

  const title = res.title ?? res.itemName ?? res.auctionTitle ?? "제목 없음";

  const thumbUrl = pickThumbUrl(res);
  const price = pickPrice(res);

  const rawStatusText =
    res.statusText ?? res.status_desc ?? res.sellingStatus ?? res.status ?? "";

  const baseLabel = toKoreanStatusLabel(rawStatusText);
  const statusEnum = toStatus(rawStatusText);

  const auctionStart = pickAuctionStart(res);
  const auctionEnd = pickAuctionEnd(res);

  const { finalStatus, finalText } = normalizeStatusForUi(
    statusEnum,
    baseLabel,
    auctionStart,
    auctionEnd
  );

  const counterparty =
    res.buyer ??
    res.buyerName ??
    res.winnerNickname ??
    res.counterparty ??
    undefined;

  const settled = computeSettled(res, finalStatus, finalText);

  // 판매자 쪽도 동일하게 결제완료 정보 실어줌(필요 시 활용)
  const paidAt = pickPaidAt(res);
  const paidLike = pickPaidFlags(res);

  const core = {
    id: String(rawId),
    orderId:
      res.orderId ??
      res.settlementId ??
      res.purchaseId ??
      res.auctionId ??
      rawId ??
      null,
    title,
    thumbUrl: thumbUrl ?? undefined,
    price,
    status: finalStatus,
    statusText: finalText || rawStatusText || "상태정보없음",
    counterparty,
    auctionStart,
    auctionEnd,
    settled,
  };

  return { ...(core as any), paidAt, ...paidLike } as unknown as TradeItem;
}

// 배열 매핑 헬퍼
export const mapPurchases = (arr: any[]) => (arr ?? []).map(fromPurchase);
export const mapSales = (arr: any[]) => (arr ?? []).map(fromSale);
