import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import TradeRowCompact from "../items/ItemCard";
import type { TradeItem } from "../../types/trade";

type Props = {
  title: string; // "구매 내역" / "판매 내역"
  items: TradeItem[]; // 전체 목록
  seeAllTo: string; // 전체보기 링크
  role: "buyer" | "seller"; // 행 클릭 시 라우팅 등 분기용(선택)
  sortBy?: "auctionEnd" | "auctionStart";
};

export default function ThreeCompactSection({
  title,
  items,
  seeAllTo,
  role,
  sortBy = "auctionEnd",
}: Props) {
  const navigate = useNavigate();

  const top3 = useMemo(() => {
    const key = sortBy === "auctionEnd" ? "auctionEnd" : "auctionStart";
    return [...(items ?? [])]
      .sort(
        (a, b) =>
          new Date(b[key] ?? 0).getTime() - new Date(a[key] ?? 0).getTime()
      )
      .slice(0, 3);
  }, [items, sortBy]);

  return (
    <section className="space-y-2">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-neutral-900">{title}</h2>
        {items.length > 3 && (
          <Link
            to={seeAllTo}
            className="text-sm text-neutral-500 hover:text-neutral-700"
            aria-label={`${title} 전체 보기`}
          >
            &gt;
          </Link>
        )}
      </div>

      <ul className="rounded-md bg-white">
        {top3.length === 0 ? (
          <li className="py-6 text-sm text-neutral-500">
            표시할 내역이 없습니다.
          </li>
        ) : (
          top3.map((it) => (
            <TradeRowCompact
              key={it.id}
              item={it}
              onClick={(id) =>
                role === "seller"
                  ? navigate(`/seller/auctions/${id}`)
                  : navigate(`/auctions/${id}`)
              }
              subtitleTop={role === "seller" ? "경매 시작 시간" : "판매자 이름"}
              subtitleBottom="경매 마감 시간"
              rightText={<span className="text-neutral-700">{it.status}</span>}
            />
          ))
        )}
      </ul>
    </section>
  );
}
