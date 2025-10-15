import React from "react";
import { useNavigate } from "react-router-dom";
import TradeCard from "../components/items/ItemCard"; // = TradeCard
import type { AuctionHistoryItem } from "../types/trade-history"; // 사용 중이면

// 더미: 실제로는 API 응답(AuctionHistoryItem[]) 사용
const items: any[] = [
  /* ... */
];

export default function PurchasesPage() {
  const navigate = useNavigate();
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-xl font-semibold">구매 내역 전체</h1>
      <ul className="space-y-3">
        {items.map((it) => (
          <TradeCard
            key={it.auctionId}
            item={it}
            role="buyer"
            onClick={(id) => navigate(`/auctions/${id}`)}
            rightSlot={
              /결제 대기/.test(it.statusText) ? (
                <button
                  className="rounded-md border px-3 py-1 text-sm hover:bg-neutral-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/checkout/${it.auctionId}`);
                  }}
                >
                  결제하기
                </button>
              ) : null
            }
          />
        ))}
      </ul>
    </div>
  );
}
