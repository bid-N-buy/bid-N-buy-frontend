// src/features/mypage/pages/PurchasesPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";

export default function PurchaseList() {
  const [page, setPage] = useState(0);
  const { data, loading, error, total } = usePurchases({
    page,
    size: 20,
    sort: "end",
  });
  const nav = useNavigate();

  if (error) return <p className="p-4 text-red-600">구매내역 불러오기 실패</p>;

  return (
    <div className="p-4">
      <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>
      {loading ? (
        <p>불러오는 중…</p>
      ) : data.length === 0 ? (
        <p className="text-neutral-500">구매 내역이 없습니다.</p>
      ) : (
        <ul>
          {data.map((it) => (
            <TradeRowCompact
              key={it.id}
              item={it}
              role="buyer"
              onClick={(id) => nav(`/auctions/${id}`)}
            />
          ))}
        </ul>
      )}

      {/* 간단 페이지네이션 예시 */}
      <div className="mt-3 flex gap-2">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="rounded border px-2 py-1"
        >
          이전
        </button>
        <span className="text-sm text-neutral-600">총 {total}건</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="rounded border px-2 py-1"
        >
          다음
        </button>
      </div>
    </div>
  );
}
