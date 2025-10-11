// components/trade/TradeRow.tsx
import React from "react";
import type { TradeItem } from "../../types/trade";

type Props = {
  item: TradeItem;
  rightSlot?: React.ReactNode; // 우측 상태/버튼 등
  onClick?: (id: string) => void;
};
export default function TradeRow({ item, rightSlot, onClick }: Props) {
  return (
    <li
      className="flex items-start gap-4 border-b border-neutral-200 py-5"
      onClick={() => onClick?.(item.id)}
    >
      <img
        src={item.thumbUrl}
        alt={item.title}
        className="size-[80px] rounded bg-neutral-200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[18px] font-bold text-neutral-900">
          {item.title}
        </p>
        <p className="mt-2 text-sm text-neutral-600">판매자 이름</p>
        <p className="text-sm text-neutral-600">
          경매 마감 시간{/* 필요시 포맷팅해서 노출 */}
        </p>
      </div>
      <div className="shrink-0 text-sm text-neutral-700">{rightSlot}</div>
    </li>
  );
}
