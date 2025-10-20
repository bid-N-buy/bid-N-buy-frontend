import React from "react";
import { useNavigate } from "react-router-dom";
import type { TradeItem } from "../../types/trade";

type Props = {
  item: TradeItem;
  onToggleLike?: (id: string) => void;
};

const Heart: React.FC<{ filled?: boolean; color?: string }> = ({
  filled = false,
  color = "#8322BF",
}) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    aria-hidden
    className="inline-block"
    fill={filled ? color : "none"}
    stroke={color}
    strokeWidth="1.8"
  >
    <path d="M12 21s-7.2-4.35-9.6-8.16C.72 9.93 2.29 6 6 6c2.02 0 3.4 1.09 4 2.09C10.6 7.09 11.98 6 14 6c3.71 0 5.28 3.93 3.6 6.84C19.2 16.65 12 21 12 21z" />
  </svg>
);

export default function WishRow({ item, onToggleLike }: Props) {
  const nav = useNavigate();

  const fmt = (dt?: string) => {
    if (!dt) return "";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "";
    const p2 = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(
      d.getHours()
    )}:${p2(d.getMinutes())}`;
  };

  return (
    <li
      className="cursor-pointer select-none"
      onClick={() => nav(`/auctions/${item.id}`)}
      role="button"
      aria-label={item.title}
    >
      <div className="flex items-start gap-4 py-5">
        {/* 썸네일 */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-200">
          {item.thumbUrl ? (
            <img
              src={item.thumbUrl}
              alt={item.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : null}
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-neutral-900">
            {item.title}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {item.counterparty ? `판매자: ${item.counterparty}` : ""}
          </p>
          <p className="text-sm text-neutral-600">
            {item.auctionEnd ? `경매 마감 시간 ${fmt(item.auctionEnd)}` : ""}
          </p>
        </div>

        {/* 우측: 하트 + 현재가 */}
        <div className="shrink-0 text-right">
          <button
            type="button"
            aria-label="찜 해제"
            className="mb-2 inline-flex items-center justify-center rounded-full p-1 hover:bg-neutral-50"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.(item.id);
            }}
          >
            <Heart />
          </button>
          <div className="text-xs text-neutral-500">현재가</div>
          <div className="text-[15px] font-semibold text-neutral-900">
            {item.price ? item.price.toLocaleString("ko-KR") : 0} 원
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
}
