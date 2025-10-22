// src/features/mypage/components/sections/ThreeCompactSection.tsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import TradeRowCompact from "../items/TradeRowCompact";
import type { TradeItem } from "../../types/trade";

// ✅ 공통 라벨 & 정렬 유틸 (경로는 프로젝트 구조에 맞춰 조정)
import { STATUS_LABEL } from "../../types/trade";
import { compareTradeItems, isEndedByTime } from "../../utils/tradeStatus";

type Props = {
  title: string; // "구매 내역" / "판매 내역"
  items: TradeItem[]; // 전체 목록
  seeAllTo: string; // 전체보기 링크
  role: "buyer" | "seller"; // 행 클릭 시 라우팅 등 분기용
  sortBy?: "auctionEnd" | "auctionStart";
};

// 공통 날짜 포맷
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

// 남은 시간 텍스트
const timeLeftLabel = (endAt?: string): string => {
  if (!endAt) return "";
  const end = new Date(endAt).getTime();
  const diff = end - Date.now();
  if (!Number.isFinite(end) || diff <= 0) return "종료";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}분 남음`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}시간 ${rm}분 남음`;
};

// 상태 배지 스타일(로컬)
const BADGE: Record<NonNullable<TradeItem["status"]>, string> = {
  BEFORE: "border-neutral-200 bg-neutral-50 text-neutral-700",
  SALE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-neutral-200 bg-neutral-50 text-neutral-700",
  FINISH: "border-neutral-200 bg-neutral-50 text-neutral-500",
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

    // 기본: 공통 정렬(진행군 우선 → 종료군, 종료 내 최근 종료 우선)
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
            const right = (
              <div className="text-right">
                <span
                  className={[
                    "inline-block rounded border px-2 py-0.5 text-[11px]",
                    BADGE[it.status],
                  ].join(" ")}
                >
                  {it.statusText ?? STATUS_LABEL[it.status]}
                </span>
                {/* 남은 시간 또는 종료 표기 */}
                {it.auctionEnd && (
                  <div className="mt-1 text-[11px] text-neutral-500">
                    {timeLeftLabel(it.auctionEnd)}
                  </div>
                )}
              </div>
            );

            return (
              <TradeRowCompact
                key={it.id}
                item={it}
                onClick={(id) => navigate(`/auctions/${id}`)}
                // 구매자: 판매자 이름, 판매자: 경매 시작 시간
                subtitleTop={
                  role === "seller"
                    ? `경매 시작: ${formatDate(it.auctionStart)}`
                    : it.counterparty || ""
                }
                // 하단은 항상 마감 시간
                subtitleBottom={`마감: ${formatDate(it.auctionEnd)}`}
                rightText={right}
                // 선택: 종료된 건은 줄 흐리게(가독성)
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
