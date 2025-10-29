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
  role: "buyer" | "seller"; // 행 클릭 시 라우팅 등 분기용
  sortBy?: "auctionEnd" | "auctionStart";
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

// ========== 상태/시간 텍스트 분리 유틸 ==========
// "진행 중 · 9시간 9분 남음" -> { badgeLabel: "진행 중", subLabel: "9시간 9분 남음" }
// "종료" -> { badgeLabel: "종료" }
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
}: Props) {
  const navigate = useNavigate();

  // 상위 3개 뽑기
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

    // 기본: 진행군 우선 → 종료군, 종료군 내부는 최근 종료 우선
    return list.sort(compareTradeItems).slice(0, 3);
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
          top3.map((it) => {
            // 상태텍스트를 두 줄(상태 / 남은시간)로 쪼갠다
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

                {/* 남은 시간 / 시작까지 남은 시간 등 */}
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
                // 구매자 화면이면 판매자 닉네임, 판매자 화면이면 "경매 시작: ~"
                subtitleTop={
                  role === "seller"
                    ? `경매 시작: ${formatDate(it.auctionStart)}`
                    : it.counterparty || ""
                }
                // 항상 마감 표기
                subtitleBottom={`마감: ${formatDate(it.auctionEnd)}`}
                rightText={right}
                // 종료된 건은 살짝 희미하게
                className={
                  isEndedByTime(it.auctionEnd) ? "opacity-80" : undefined
                }
              />
            );
          })
        )}
      </ul>
    </section>
  );
}
