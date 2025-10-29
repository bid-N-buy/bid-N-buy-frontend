// src/features/mypage/utils/tradeMappers.ts

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
    src.itemImageUrl ?? // /mypage/purchase 응답 등 다양한 케이스 대응
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
  return res.endTime ?? res.endAt ?? res.endedAt ?? res.closeAt ?? undefined;
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
 *
 * 규칙:
 * - 서버가 "결제~" 상태를 주는데 아직 정산까지 안 갔다면 → "정산중"
 *   (ex. "결제 완료", "결제 대기 중")
 * - "정산 완료", "거래 완료" 등 이미 끝난 건 그대로 둔다.
 */
function massagePurchaseStatusText(raw: string): string {
  const text = raw?.toString()?.trim() ?? "";

  // 이미 "완료"류인 경우 그대로 둔다.
  if (
    text.includes("정산") ||
    text.includes("거래 완료") ||
    text.includes("완료") // ex. "정산 완료", "거래 완료"
  ) {
    return text;
  }

  // 결제 관련인데 아직 정산 언급 없으면 우리 표현으로는 "정산중"
  if (text.includes("결제")) {
    return "정산중";
  }

  // 모를 땐 그대로 주거나 비어있음 → "상태정보없음"
  return text || "상태정보없음";
}

/* =========================
 * 내부 헬퍼: settled 판별
 * ========================= */
/**
 * 이 거래가 "이미 구매확정/정산까지 끝난 상태냐?" 를 boolean으로 리턴.
 * true면 버튼 숨겨야 함.
 */
function computeSettled(
  res: any,
  finalStatus: TradeItem["status"],
  finalText: string
): boolean {
  // 1) 서버가 직접 내려주는 확정 여부 플래그가 최우선
  if (res.settled === true) return true;
  if (res.isSettled === true) return true;
  if (res.confirmed === true) return true;

  // 2) finalStatus가 "COMPLETED"라면
  //    - 이건 진짜로 '거래 완료'까지 간 상태라고 간주
  if (finalStatus === "COMPLETED") {
    return true;
  }

  // 3) finalText 안에 '정산 완료', '거래 완료' 등 최종 완료성 문구가 있으면 true
  const txt = (finalText || "").toString();
  if (
    txt.includes("거래 완료") ||
    txt.includes("정산 완료") ||
    txt.includes("정산완료")
  ) {
    return true;
  }

  // 4) 나머지는 아직 구매확정 가능 상태 (false)
  //    FINISH(종료)라고 해도 그냥 경매가 끝났다는 뜻일 수 있으니까
  //    여기서는 false로 둬서 버튼이 뜨게 할 수 있음.
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

  return {
    // 화면에서 쓸 대표 ID (문자열화)
    id: String(rawId),

    // 구매확정/정산 요청에 쓸 주문/정산 ID 후보들 중 하나
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
    // finalText 우선, 비면 adjustedStatusText, 그것도 없으면 "상태정보없음"
    statusText: finalText || adjustedStatusText || "상태정보없음",

    counterparty,

    auctionStart,
    auctionEnd,

    // 버튼 노출 여부 판단에 쓰일 최종 완료 여부
    settled,
  };
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

  // 판매자 화면에서도 동일하게 최종 완료 여부 뽑을 수 있음
  const settled = computeSettled(res, finalStatus, finalText);

  return {
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
}

// 배열 매핑 헬퍼
export const mapPurchases = (arr: any[]) => (arr ?? []).map(fromPurchase);
export const mapSales = (arr: any[]) => (arr ?? []).map(fromSale);
