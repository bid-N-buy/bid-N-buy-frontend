// src/features/mypage/components/items/TradeRowCompact.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import type { TradeItem } from "../../types/trade";

type Props = {
  item: TradeItem;
  /** 우측에 표시할 사용자 정의 내용(미지정 시 statusText → status 순으로 표시) */
  rightText?: React.ReactNode;
  /** 행 클릭 시 (기본: 경매 상세로 이동) */
  onClick?: (id: string) => void;
  /** 상단 보조 텍스트(미지정 시 거래상대 표시) */
  subtitleTop?: string;
  /** 하단 보조 텍스트(미지정 시 마감시간 표시) */
  subtitleBottom?: string;
};

function fmt(dt?: string) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export default function TradeRowCompact({
  item,
  rightText,
  onClick,
  subtitleTop,
  subtitleBottom,
}: Props) {
  const nav = useNavigate();

  const handleRowClick = () => {
    if (onClick) onClick(item.id);
    else nav(`/auctions/${item.id}`);
  };

  // 우측 영역: 커스텀 > statusText > status
  const rightNode: React.ReactNode =
    rightText ?? item.statusText ?? item.status;

  const top =
    subtitleTop ?? (item.counterparty ? `거래상대: ${item.counterparty}` : "");
  const bottom =
    subtitleBottom ?? (item.auctionEnd ? `마감: ${fmt(item.auctionEnd)}` : "");

  return (
    <li
      className="cursor-pointer select-none"
      onClick={handleRowClick}
      role="button"
      aria-label={item.title}
    >
      <div className="flex items-start gap-4 py-4">
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
          {top && <p className="mt-1 text-sm text-neutral-600">{top}</p>}
          {bottom && <p className="text-sm text-neutral-600">{bottom}</p>}
          {typeof item.price === "number" && (
            <p className="mt-1 text-sm text-neutral-700">
              {item.price.toLocaleString("ko-KR")}원
            </p>
          )}
        </div>

        {/* 우측 상태 */}
        <div className="shrink-0 pl-2 text-sm text-neutral-700">
          {rightNode}
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
}
