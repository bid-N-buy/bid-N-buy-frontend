// src/features/mypage/components/sections/ThreeCompactSection.tsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import TradeRowCompact from "../items/TradeRowCompact";
import type { TradeItem } from "../../types/trade";

// 공통 유틸
import { STATUS_LABEL } from "../../utils/tradeMappers";
import { compareTradeItems, isEndedByTime } from "../../utils/tradeStatus";

type Props = {
  title: string; // "구매 내역" / "판매 내역"
  items: TradeItem[]; // 전체 목록
  seeAllTo: string; // 전체보기 링크
  role: "buyer" | "seller"; // 뱃지/부제 라벨 분기
  sortBy?: "auctionEnd" | "auctionStart";

  // ✅ 빈 상태일 때 보여줄 CTA
  emptyCtaLabel?: string; // 예: "경매 등록하기"
  onEmptyCtaClick?: () => void; // 예: () => nav("/auctions/new")
};

// ========== 날짜 포맷 유틸 ==========
const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mi = `${d.getMinutes()}`.padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
};

// ========== 상태/시간 텍스트 쪼개기 ==========
// "진행 중 · 9시간 9분 남음"
// -> { badgeLabel: "진행 중", subLabel: "9시간 9분 남음" }
function splitStatus(statusText?: string): {
  badgeLabel: string;
  subLabel?: string;
} {
  if (!statusText) return { badgeLabel: "" };

  const parts = statusText.split("·").map((s) => s.trim());

  if (parts.length === 1) {
    return { badgeLabel: parts[0] };
  }

  return {
    badgeLabel: parts[0],
    subLabel: parts.slice(1).join(" · "),
  };
}

// ========== 상태 배지 스타일 ==========
const BADGE: Record<NonNullable<TradeItem["status"]>, string> = {
  BEFORE: "border-neutral-300 bg-neutral-50 text-neutral-700",
  SALE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-neutral-300 bg-neutral-50 text-neutral-700",
  FINISH: "border-neutral-300 bg-neutral-50 text-neutral-500",
  UNKNOWN: "border-neutral-300 bg-neutral-50 text-neutral-500",
};

export default function ThreeCompactSection({
  title,
  items,
  seeAllTo,
  role,
  sortBy = "auctionEnd",
  emptyCtaLabel,
  onEmptyCtaClick,
}: Props) {
  const navigate = useNavigate();

  // 정렬 후 상위 3개만 보여주기
  const top3 = useMemo(() => {
    const list = [...(items ?? [])];

    if (sortBy === "auctionStart") {
      // 시작시간 기준 최신순
      return list
        .sort(
          (a, b) =>
            new Date(b.auctionStart ?? 0).getTime() -
            new Date(a.auctionStart ?? 0).getTime()
        )
        .slice(0, 3);
    }

    // 기본: 진행중 우선 → 종료된 것, 종료된 것 안에서는 최근 종료 우선
    return list.sort(compareTradeItems).slice(0, 3);
  }, [items, sortBy]);

  const showSeeAll = items.length > 3;

  // ✅ 빈 상태 문구 role따라 다르게
  const emptyMessage =
    role === "buyer" ? "구매 내역이 없습니다." : "판매 내역이 없습니다.";

  return (
    <section className="space-y-2">
      {/* 헤더 (타이틀 + 전체보기 >) */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-neutral-900">{title}</h2>

        {showSeeAll && (
          <Link
            to={seeAllTo}
            className="text-sm text-neutral-500 hover:text-neutral-700"
            aria-label={`${title} 전체 보기`}
          >
            &gt;
          </Link>
        )}
      </div>

      {/* 리스트 / 빈 상태 */}
      {top3.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center">
          <p className="text-sm text-neutral-500">{emptyMessage}</p>

          {emptyCtaLabel && onEmptyCtaClick && (
            <button
              type="button"
              onClick={onEmptyCtaClick}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-purple-500/50 hover:brightness-110 focus:ring-2 focus:ring-purple-400 focus:outline-none"
            >
              {emptyCtaLabel}
            </button>
          )}
        </div>
      ) : (
        <ul className="rounded-md bg-white">
          {top3.map((it) => {
            // 상태텍스트 -> 상태뱃지 + 서브라벨로 분리
            const { badgeLabel, subLabel } = splitStatus(
              it.statusText ?? STATUS_LABEL[it.status]
            );

            const right = (
              <div className="text-right">
                <span
                  className={[
                    "inline-block rounded border px-2 py-1 text-[11px] leading-[1.1] font-medium",
                    BADGE[it.status],
                  ].join(" ")}
                >
                  {badgeLabel}
                </span>

                {subLabel && (
                  <div className="mt-1 text-[11px] text-neutral-500">
                    {subLabel}
                  </div>
                )}
              </div>
            );

            return (
              <TradeRowCompact
                key={it.id}
                item={it}
                onClick={(id) => navigate(`/auctions/${id}`)}
                // seller면 "경매 시작: yyyy.mm.dd hh:mm"
                // buyer면 상대 닉네임
                subtitleTop={
                  role === "seller"
                    ? `경매 시작: ${formatDate(it.auctionStart)}`
                    : it.counterparty || ""
                }
                // 항상 마감 시간은 보여주자
                subtitleBottom={`마감: ${formatDate(it.auctionEnd)}`}
                rightText={right}
                className={
                  isEndedByTime(it.auctionEnd) ? "opacity-80" : undefined
                }
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
