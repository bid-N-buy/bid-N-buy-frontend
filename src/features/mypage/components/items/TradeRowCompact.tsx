// src/features/mypage/components/items/TradeRowCompact.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import type { TradeItem } from "../../types/trade";

type AnyItem = TradeItem | Record<string, any>;

type Props = {
  item: AnyItem;
  rightText?: React.ReactNode;
  onClick?: (id: string) => void; // 문자열 id로 통일
  subtitleTop?: string;
  subtitleBottom?: string;
  className?: string;
};

function fmt(dt?: string) {
  if (!dt) return "";
  const t = Date.parse(dt);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(
    d.getHours()
  )}:${p2(d.getMinutes())}`;
}

/** 공통 뷰모델 정규화 */
function normalize(item: AnyItem) {
  const any = item as any;

  // ✅ URL에 넣을 id는 문자열로 통일 (auctionId 우선, 없으면 id)
  const rawId = any.auctionId ?? any.id;
  const idStr =
    typeof rawId === "string"
      ? rawId
      : typeof rawId === "number"
        ? String(rawId)
        : "";

  const thumbUrl =
    any.thumbUrl ??
    any.mainImageUrl ??
    any.itemImageUrl ??
    any.imageUrl ??
    null;

  const status = any.status ?? any.sellingStatus ?? undefined;
  const statusText = any.statusText ?? undefined;

  const counterparty =
    any.counterparty ?? any.sellerNickname ?? any.winnerNickname ?? "";

  const auctionEnd = any.auctionEnd ?? any.endTime ?? undefined;

  const price =
    typeof any.price === "number"
      ? any.price
      : typeof any.currentPrice === "number"
        ? any.currentPrice
        : typeof any.finalPrice === "number"
          ? any.finalPrice
          : undefined;

  return {
    idStr, // ← 문자열 id
    title: String(any.title ?? ""),
    thumbUrl: thumbUrl as string | null,
    price: price as number | undefined,
    status: status as string | undefined,
    statusText: statusText as string | undefined,
    counterparty: counterparty as string,
    auctionEnd: auctionEnd as string | undefined,
  };
}

export default function TradeRowCompact({
  item,
  rightText,
  onClick,
  subtitleTop,
  subtitleBottom,
  className,
}: Props) {
  const nav = useNavigate();
  const n = normalize(item);

  const handleRowClick = () => {
    if (!n.idStr) return; // id 없으면 무시
    if (onClick) onClick(n.idStr);
    else nav(`/auctions/${n.idStr}`);
  };

  const rightNode = rightText ?? n.statusText ?? n.status ?? "";
  const top =
    subtitleTop ?? (n.counterparty ? `판매자: ${n.counterparty}` : "");
  const bottom =
    subtitleBottom ?? (n.auctionEnd ? `마감: ${fmt(n.auctionEnd)}` : "");

  return (
    <li
      className={["cursor-pointer select-none", className ?? ""]
        .join(" ")
        .trim()}
      onClick={handleRowClick}
      role="button"
      aria-label={n.title || "경매 항목"}
    >
      <div className="flex items-start gap-4 py-4">
        {/* 썸네일 */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-200">
          {n.thumbUrl ? (
            <img
              src={n.thumbUrl}
              alt={n.title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility =
                  "hidden";
              }}
            />
          ) : null}
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-neutral-900">
            {n.title}
          </p>
          {top && <p className="mt-1 text-sm text-neutral-600">{top}</p>}
          {bottom && <p className="text-sm text-neutral-600">{bottom}</p>}
          {typeof n.price === "number" && (
            <p className="mt-1 text-sm text-neutral-700">
              {n.price.toLocaleString("ko-KR")}원
            </p>
          )}
        </div>

        {/* 우측 상태 */}
        <div
          className="shrink-0 pl-2 text-sm text-neutral-700"
          onClick={(e) => e.stopPropagation()}
        >
          {rightNode}
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
}
