import React from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../hooks/useSales";
import TradeRowCompact from "../components/items/TradeRowCompact";

export default function SaleList() {
  const { data, loading, error } = useSales({ page: 0, size: 20, sort: "end" });
  const nav = useNavigate();

  if (error) return <p className="p-4 text-red-600">판매내역 불러오기 실패</p>;

  return (
    <div className="p-4">
      <h2 className="mb-3 text-lg font-semibold">판매 내역</h2>
      {loading ? (
        <p>불러오는 중…</p>
      ) : data.length === 0 ? (
        <p className="text-neutral-500">판매 내역이 없습니다.</p>
      ) : (
        <ul>
          {data.map((it) => (
            <TradeRowCompact
              key={it.id}
              item={it}
              role="seller"
              onClick={(id) => nav(`/auctions/${id}`)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
