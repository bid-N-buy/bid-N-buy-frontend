import React from "react";
import type { TradeItem } from "../../types/trade";

type Props = {
  item: TradeItem;
  rightText?: React.ReactNode; // 우측 상태 텍스트/버튼
  onClick?: (id: string) => void;
  subtitleTop?: string; // "판매자 이름" / "경매 시작 시간" 등
  subtitleBottom?: string; // "경매 마감 시간" 등
};

export default function TradeRowCompact({
  item,
  rightText,
  onClick,
  subtitleTop,
  subtitleBottom,
}: Props) {
  return (
    <li
      className="cursor-pointer select-none"
      onClick={() => onClick?.(item.id)}
      role="button"
      aria-label={item.title}
    >
      <div className="flex items-start gap-4 py-4">
        {/* 썸네일 */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-200">
          <img
            src={item.thumbUrl}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-neutral-900">
            {item.title}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {subtitleTop ?? "판매자 이름"}
          </p>
          <p className="text-sm text-neutral-600">
            {subtitleBottom ?? "경매 마감 시간"}
          </p>
        </div>

        {/* 우측 상태 */}
        <div className="shrink-0 pl-2 text-sm text-neutral-700">
          {rightText ?? item.status}
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
}
