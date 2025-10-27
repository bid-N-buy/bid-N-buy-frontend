// src/features/mypage/utils/tradeMappers.ts
import type { TradeItem } from "../types/trade";
import { toStatus, toKoreanStatusLabel } from "./statusLabel";

/**
 * 이미지 URL 하나 뽑는 우선순위 유틸
 * (찜, 구매내역, 판매내역 응답 다 지원)
 */
function pickThumbUrl(src: any): string | null {
  return (
    src.mainImageUrl ?? // /wishs
    src.itemImageUrl ?? // /mypage/purchase, /mypage/sales
    src.thumbnail ??
    src.thumbnailUrl ??
    src.image ??
    src.imageUrl ??
    null
  );
}

/**
 * 구매내역 API → TradeItem
 */
export function fromPurchase(res: any): TradeItem {
  const rawId =
    res.id ??
    res.auctionId ??
    res.auction_id ??
    res.auctionID ??
    res.itemId ??
    0;

  const title = res.itemName ?? res.title ?? res.auctionTitle ?? "제목 없음";

  const thumbUrl = pickThumbUrl(res);

  const price =
    Number(
      res.finalPrice ?? res.price ?? res.bidPrice ?? res.currentPrice ?? 0
    ) || 0;

  // 서버 원본 상태 문자열 (status / sellingStatus / statusText 등)
  const rawStatusText =
    res.statusText ?? res.status_desc ?? res.sellingStatus ?? res.status ?? "";

  const statusText = toKoreanStatusLabel(rawStatusText); // "진행 중" 등
  const status = toStatus(rawStatusText); // "PROGRESS" 등

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
    id: String(rawId),
    title,
    thumbUrl,
    price,
    status, // 내부 enum-ish
    statusText, // 사용자 라벨
    counterparty,
    auctionStart,
    auctionEnd,
  };
}

/**
 * 판매내역 API → TradeItem
 */
export function fromSale(res: any): TradeItem {
  const rawId =
    res.id ??
    res.auctionId ??
    res.auction_id ??
    res.auctionID ??
    res.itemId ??
    0;

  const title = res.title ?? res.itemName ?? res.auctionTitle ?? "제목 없음";

  const thumbUrl = pickThumbUrl(res);

  const price =
    Number(res.finalPrice ?? res.price ?? res.currentPrice ?? 0) || 0;

  const rawStatusText =
    res.statusText ?? res.status_desc ?? res.sellingStatus ?? res.status ?? "";

  const statusText = toKoreanStatusLabel(rawStatusText);
  const status = toStatus(rawStatusText);

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
    id: String(rawId),
    title,
    thumbUrl,
    price,
    status,
    statusText,
    counterparty,
    auctionStart,
    auctionEnd,
  };
}

export const mapPurchases = (arr: any[]) => (arr ?? []).map(fromPurchase);
export const mapSales = (arr: any[]) => (arr ?? []).map(fromSale);
