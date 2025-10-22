import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { AuctionItem } from "../../../auction/types/auctions";

type Props = {
  item: AuctionItem;
  onToggleLike?: (auctionId: number, nextLiked: boolean) => void;
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

function fmtEnd(dt?: string) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(
    d.getHours()
  )}:${p2(d.getMinutes())}`;
}

function makeAbsolute(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  try {
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${window.location.origin}${path}`;
  } catch {
    return url;
  }
}

export default function WishRow({ item, onToggleLike }: Props) {
  const nav = useNavigate();

  const endStr = useMemo(() => fmtEnd(item.endTime), [item.endTime]);
  const priceStr = useMemo(
    () => (item.currentPrice ?? 0).toLocaleString("ko-KR"),
    [item.currentPrice]
  );

  const thumb = useMemo(
    () => makeAbsolute(item.mainImageUrl) ?? undefined,
    [item.mainImageUrl]
  );

  const goDetail = useCallback(
    () => nav(`/auctions/${item.auctionId}`),
    [nav, item.auctionId]
  );

  const onKey = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goDetail();
    }
  };

  const liked = !!item.liked;

  return (
    <li
      className="cursor-pointer select-none"
      onClick={goDetail}
      onKeyDown={onKey}
      tabIndex={0}
      role="button"
      aria-label={item.title}
    >
      <div className="flex items-start gap-4 py-5">
        {/* 썸네일 */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-200">
          {thumb ? (
            <img
              src={thumb}
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

          {/* 판매자 */}
          <p className="mt-1 text-sm text-neutral-600">
            {item.sellerNickname ? `판매자: ${item.sellerNickname}` : ""}
          </p>

          {/* 상태 + 종료 시간 */}
          <p className="text-sm text-neutral-600">
            {endStr ? `경매 마감 시간 ${endStr}` : ""}
          </p>
          {item.sellingStatus && (
            <span className="mt-1 inline-flex items-center rounded-full border px-2 py-[2px] text-[11px] text-neutral-700">
              {item.sellingStatus}
            </span>
          )}
        </div>

        {/* 우측: 하트 + 현재가 */}
        <div className="shrink-0 text-right">
          <button
            type="button"
            aria-label={liked ? "찜 해제" : "찜 하기"}
            aria-pressed={liked}
            className="mb-2 inline-flex items-center justify-center rounded-full p-1 hover:bg-neutral-50"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.(item.auctionId, !liked);
            }}
          >
            <Heart filled={liked} />
          </button>
          <div className="text-xs text-neutral-500">현재가</div>
          <div className="text-[15px] font-semibold text-neutral-900">
            {priceStr} 원
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
}
