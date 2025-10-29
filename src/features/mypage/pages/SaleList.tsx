// src/features/mypage/pages/SaleList.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../hooks/useSales";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";

// 진행중/완료 판별 util + 정렬 util
import { isOngoing, compareTradeItems } from "../utils/tradeStatus";

// 경매 아이템 타입 (판매 목록에서 내려오는 구조랑 호환되는 최소 타입)
import type { AuctionItem } from "../../auction/types/auctions";

/**
 * 정렬/필터 편하게 하려고 최소 필드만 뽑아 둔 포맷
 * - id
 * - status(진행상태)
 * - auctionEnd(종료 시각)
 * - original(실제 렌더링에 쓸 원본)
 */
type NormForFilter = {
  id: number;
  status: string;
  auctionEnd: string;
  original: AuctionItem | any;
};

export default function SaleList() {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const nav = useNavigate();

  // 실제 데이터 로드 (이제 mock fallback 없음)
  const { data, loading, error } = useSales({
    page: 0,
    size: 20,
    sort: "end",
  });

  /**
   * data는 TradeItem[] 형태(fromSale()으로 정리된 결과)라고 가정.
   * TradeItem 안에 최소한:
   *   - auctionId or id
   *   - sellingStatus or status
   *   - endTime or auctionEnd
   * 이런 값들이 들어있다고 보는 흐름 그대로 유지.
   *
   * 만약 실제 필드명이 살짝 다르면 아래 매핑을 그에 맞게 바꿔주면 돼.
   */
  const normalized: NormForFilter[] = useMemo(
    () =>
      (data ?? []).map((it: any) => ({
        id: (it.auctionId ?? it.id) as number,
        status: (it.sellingStatus ?? it.status ?? "") as string,
        auctionEnd: (it.endTime ?? it.auctionEnd ?? "") as string,
        original: it,
      })),
    [data]
  );

  // 진행중/완료 개수 계산 (탭 카운트에 표시)
  const counts = useMemo(() => {
    const all = normalized.length;
    const ongoing = normalized.filter((d) =>
      isOngoing({ status: d.status, auctionEnd: d.auctionEnd })
    ).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [normalized]);

  // 필터링 (전체 / 진행중 / 완료)
  const filtered = useMemo(() => {
    if (filter === "all") return normalized;

    if (filter === "ongoing") {
      return normalized.filter((d) =>
        isOngoing({ status: d.status, auctionEnd: d.auctionEnd })
      );
    }

    // filter === "ended"
    return normalized.filter(
      (d) => !isOngoing({ status: d.status, auctionEnd: d.auctionEnd })
    );
  }, [normalized, filter]);

  // 정렬 (compareTradeItems는 {status, auctionEnd} 기반으로 우선순위 줄 거라고 가정)
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareTradeItems(a as any, b as any)),
    [filtered]
  );

  // 리스트 렌더 helper
  const renderList = (list: NormForFilter[]) => (
    <ul className="min-h-[800px]">
      {list.map(({ id, original }) => (
        <TradeRowCompact
          key={id}
          item={original}
          onClick={(clickedId) => nav(`/auctions/${clickedId}`)}
        />
      ))}
    </ul>
  );

  // 빈 상태 UI (경매 등록 버튼 포함)
  const renderEmptyState = () => (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <p className="text-sm text-gray-600">판매 내역이 없습니다.</p>

      <button
        type="button"
        onClick={() => nav("/auctions/new")} // ← 경매 등록/상품 올리기 페이지 경로 맞춰줘
        className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-purple-500/50 hover:brightness-110 focus:ring-2 focus:ring-purple-400 focus:outline-none"
      >
        경매 등록하기
      </button>
    </div>
  );

  // 에러 상태 처리
  if (error && !loading && normalized.length === 0) {
    return (
      <div className="min-h-[800px] p-4">
        <h2 className="mb-3 text-lg font-semibold">판매 내역</h2>

        <StatusTriFilter
          value={filter}
          onChange={setFilter}
          counts={{ all: 0, ongoing: 0, ended: 0 }}
          className="mb-3"
        />

        {/* 에러났고 아무 데이터도 못 받았을 때도 빈상태+CTA로 통일 */}
        {renderEmptyState()}
      </div>
    );
  }

  // 정상 렌더
  return (
    <div className="min-h-[800px] p-4">
      <h2 className="text-lg font-semibold">판매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
      />

      {loading ? (
        <p className="text-neutral-500">불러오는 중…</p>
      ) : sorted.length === 0 ? (
        renderEmptyState()
      ) : (
        renderList(sorted)
      )}
    </div>
  );
}
