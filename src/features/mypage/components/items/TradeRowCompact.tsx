// src/features/mypage/components/trade/TradeRowCompact.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import type { TradeItem } from "../../types/trade";

type Role = "buyer" | "seller";

type Props = {
  item: TradeItem;
  /** 구매/판매 화면 중 어디서 쓰는지 */
  role?: Role;
  /** 우측에 강제 노출할 텍스트/버튼 (지정 시 role/status 기반 자동 버튼보다 우선) */
  rightText?: React.ReactNode;
  /** 행 클릭 시 (기본: 경매 상세로 이동) */
  onClick?: (id: string) => void;
  /** 상단 보조 텍스트(미지정 시 판매자/시작시간 등 표시) */
  subtitleTop?: string;
  /** 하단 보조 텍스트(미지정 시 마감시간 표시) */
  subtitleBottom?: string;
};

function fmt(dt?: string | number | null) {
  if (!dt) return "";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default function TradeRowCompact({
  item,
  role,
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

  // role/status 조합으로 우측 영역 구성
  let rightNode: React.ReactNode = rightText ?? item.status;
  if (!rightText) {
    if (role === "buyer" && item.status === "WAIT_PAY") {
      rightNode = (
        <button
          className="rounded-md border px-3 py-1 text-sm hover:bg-neutral-50"
          onClick={(e) => {
            e.stopPropagation();
            nav(`/checkout/${item.id}`);
          }}
        >
          결제하기
        </button>
      );
    } else if (role === "seller" && item.status === "PAID") {
      rightNode = (
        <button
          className="rounded-md border px-3 py-1 text-sm hover:bg-neutral-50"
          onClick={(e) => {
            e.stopPropagation();
            nav(`/ship/${item.id}`);
          }}
        >
          발송등록
        </button>
      );
    }
  }

  const top =
    subtitleTop ??
    (item.sellerName ? `판매자: ${item.sellerName}` : fmt(item.auctionStart));
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
        </div>

        {/* 우측 상태/버튼 */}
        <div className="shrink-0 pl-2 text-sm text-neutral-700">
          {rightNode}
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
}
