import type { TradeItem, TradeStatus } from "../types/trade";

const STATUS_MAP: Record<string, TradeStatus> = {
  WAIT_PAY: "WAIT_PAY",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
  CLOSED: "CLOSED",
  CANCELED: "CANCELED",
  BIDDING: "BIDDING",
};

export const toStatus = (s?: string): TradeStatus =>
  STATUS_MAP[(s ?? "").toUpperCase()] ?? "CLOSED";

// 백엔드 응답 각각을 공통 모델로 변환
export const fromPurchase = (r: any): TradeItem => ({
  id: String(r.id),
  title: r.itemName,
  thumbUrl: r.thumbnail,
  sellerName: r.seller,
  auctionStart: r.startAt,
  auctionEnd: r.endAt,
  status: toStatus(r.status),
});

export const fromSale = (r: any): TradeItem => ({
  id: String(r.id),
  title: r.title,
  thumbUrl: r.image,
  buyerName: r.buyer,
  auctionStart: r.startAt,
  auctionEnd: r.endAt,
  status: toStatus(r.status),
});
