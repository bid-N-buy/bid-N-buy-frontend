// src/features/mypage/utils/tradeMappers.ts
import type { TradeItem, TradeStatus } from "../types/trade";

/* =========================================
 *      문자열 매칭 유틸
 * ========================================= */
const has = (s: string, kw: string) => s.includes(kw);
const hasAny = (s: string, kws: string[]) => kws.some((k) => s.includes(k));

/* =========================================
 *   서버 status/문구 → 화면 공통 상태 값 정규화
 *   TARGET: BEFORE | SALE | PROGRESS | COMPLETED | FINISH
 * ========================================= */
function toStatus(raw?: string): TradeStatus {
  const s = (raw ?? "").trim().toUpperCase();

  // ---- 1) COMPLETED (거래 '완료') ----
  // ex) COMPLETED, 거래완료, 수취완료, 정산완료, Done but context says 'completed'
  if (
    hasAny(s, [
      "COMPLETED",
      "COMPLETE",
      "TRANSACTION COMPLETE",
      "거래완료",
      "구매확정",
      "수취완료",
      "정산완료",
      "완료됨",
    ])
  ) {
    return "COMPLETED";
  }

  // ---- 2) FINISH (경매/판매 '종료' - 낙찰/유찰 포함) ----
  // ex) FINISH, CLOSED, ENDED, 종료, 마감, 유찰, 낙찰(후 거래확정 전)
  if (
    hasAny(s, [
      "FINISH",
      "FINISHED",
      "CLOSED",
      "CLOSE",
      "ENDED",
      "END",
      "종료",
      "마감",
      "유찰",
    ])
  ) {
    return "FINISH";
  }

  // ---- 3) PROGRESS (결제/배송 등 '진행 중') ----
  // ex) 결제 대기/완료, 배송 준비/중/완료(수취 전), 발송, 처리중, 진행중
  if (
    hasAny(s, [
      "PROGRESS",
      "IN PROGRESS",
      "WAIT", // WAIT_PAY 등
      "결제",
      "배송",
      "발송",
      "처리중",
      "진행중",
      "PROCESS",
      "SHIP",
      "PAID",
      "PAY",
    ])
  ) {
    return "PROGRESS";
  }

  // ---- 4) SALE (판매 중/입찰 중: 아직 진행 중이며 결제/배송 단계 전) ----
  // ex) SALE, SELLING, BIDDING, 입찰중, 판매중
  if (hasAny(s, ["SALE", "SELLING", "BIDDING", "입찰", "판매중"])) {
    return "SALE";
  }

  // ---- 5) BEFORE (등록 전/대기/비공개/검수 대기 등 초기 상태) ----
  if (hasAny(s, ["BEFORE", "대기", "준비중", "등록전", "비공개", "검수"])) {
    return "BEFORE";
  }

  // 알 수 없는 값은 안전하게 'FINISH'로 처리
  return "FINISH";
}

/* =========================================
 *   구매내역 응답 → TradeItem (안전 매핑)
 * ========================================= */
export function fromPurchase(res: any): TradeItem {
  const id =
    res.id ??
    res.auctionId ??
    res.auction_id ??
    res.auctionID ??
    res.itemId ??
    0;

  const title = res.itemName ?? res.title ?? res.auctionTitle ?? "제목 없음";

  const thumbUrl =
    res.thumbnail ?? res.thumbnailUrl ?? res.itemImageUrl ?? res.image ?? null;

  const price =
    Number(
      res.finalPrice ?? res.price ?? res.bidPrice ?? res.currentPrice ?? 0
    ) || 0;

  const statusText =
    res.statusText ?? res.status_desc ?? res.status ?? "진행 중";

  // 구매내역 기준의 상대방은 보통 "판매자"
  const counterparty =
    res.seller ??
    res.sellerName ??
    res.sellerNickname ??
    res.counterparty ??
    undefined;

  const auctionStart =
    res.startAt ?? res.startTime ?? res.auctionStart ?? undefined;

  const auctionEnd =
    res.endAt ?? res.endTime ?? res.endedAt ?? res.closeAt ?? undefined;

  return {
    id: String(id),
    title,
    thumbUrl,
    price,
    status: toStatus(res.status ?? statusText),
    statusText,
    counterparty,
    auctionStart,
    auctionEnd,
  };
}

/* =========================================
 *   판매내역 응답 → TradeItem (안전 매핑)
 * ========================================= */
export function fromSale(res: any): TradeItem {
  const id =
    res.id ??
    res.auctionId ??
    res.auction_id ??
    res.auctionID ??
    res.itemId ??
    0;

  const title = res.title ?? res.itemName ?? res.auctionTitle ?? "제목 없음";

  const thumbUrl =
    res.image ?? res.thumbnailUrl ?? res.itemImageUrl ?? res.thumbnail ?? null;

  const price =
    Number(res.finalPrice ?? res.price ?? res.currentPrice ?? 0) || 0;

  const statusText =
    res.statusText ?? res.status_desc ?? res.status ?? "진행 중";

  // 판매내역 기준의 상대방은 보통 "구매자/낙찰자"
  const counterparty =
    res.buyer ??
    res.buyerName ??
    res.winnerNickname ??
    res.counterparty ??
    undefined;

  const auctionStart =
    res.startAt ?? res.startTime ?? res.auctionStart ?? undefined;

  const auctionEnd =
    res.endAt ?? res.endTime ?? res.endedAt ?? res.closeAt ?? undefined;

  return {
    id: String(id),
    title,
    thumbUrl,
    price,
    status: toStatus(res.status ?? statusText),
    statusText,
    counterparty,
    auctionStart,
    auctionEnd,
  };
}

/* =========================================
 *   여러 개 변환 도우미
 * ========================================= */
export const mapPurchases = (arr: any[]) => (arr ?? []).map(fromPurchase);
export const mapSales = (arr: any[]) => (arr ?? []).map(fromSale);
