// src/features/mypage/utils/tradeStatus.ts
import type { TradeItem, TradeStatus } from "../types/trade";

export function isOngoingStatus(status: TradeStatus) {
  return status === "SALE" || status === "PROGRESS" || status === "BEFORE";
}

export function isEndedStatus(status: TradeStatus) {
  return status === "FINISH" || status === "COMPLETED";
}

export const isEndedByTime = (endAt?: string): boolean => {
  if (!endAt) return false;
  const t = new Date(endAt).getTime();
  return Number.isFinite(t) ? t <= Date.now() : false;
};

// 아이템 전용(상태+종료시간 고려) — PurchasesPage에서 이걸 import
export function isOngoing(item: Pick<TradeItem, "status" | "auctionEnd">) {
  if (isEndedByTime(item.auctionEnd)) return false;
  return isOngoingStatus(item.status);
}

export function isEnded(item: Pick<TradeItem, "status" | "auctionEnd">) {
  if (isEndedByTime(item.auctionEnd)) return true;
  return isEndedStatus(item.status);
}
