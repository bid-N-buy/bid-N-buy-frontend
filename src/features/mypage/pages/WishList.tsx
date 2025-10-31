// src/features/mypage/pages/WishList.tsx
import React, { useMemo, useState, useCallback } from "react";
import { useWishlist } from "../hooks/useWishlist";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";

import {
  isOngoing as isOngoingCore,
  isEndedByTime,
  compareTradeItems,
} from "../utils/tradeStatus";
import type { TradeItem } from "../types/trade";

/* ---------------------------------------------
 * 위시리스트: 상태문구 기반 '종료' 판정 보강
 * --------------------------------------------- */
const U = (v?: string | null) => (v ?? "").toString().trim().toUpperCase();

const ENDED_KEYWORDS = new Set([
  "COMPLETE",
  "COMPLETED",
  "FINISH",
  "FINISHED",
  "END",
  "ENDED",
  "CANCEL",
  "CANCELED",
  "CANCELLED",
  "FAIL",
  "FAILED",
  "DONE",
  // 한글
  "거래 완료",
  "거래완료",
  "종료",
  "판매 종료",
  "판매종료",
  "유찰",
]);

/** 상태문구로 종료로 볼 수 있으면 true */
function isEndedLikeText(item: TradeItem): boolean {
  const cands = [
    (item as any)?.statusText,
    (item as any)?.status,
    (item as any)?.state,
  ]
    .map((x) => U(x))
    .filter(Boolean);

  return cands.some((txt) =>
    Array.from(ENDED_KEYWORDS).some((kw) => txt.includes(U(kw)))
  );
}

/** 위시리스트용 진행/종료 판정:
 *  - 시간 경과면 종료
 *  - 상태문구가 종료류면 종료
 *  - 그 외엔 공통 isOngoing 로직 사용
 */
function isOngoingWishlist(item: TradeItem): boolean {
  if (isEndedByTime((item as any)?.auctionEnd)) return false;
  if (isEndedLikeText(item)) return false;
  return isOngoingCore(item);
}

/* =========================================================
 * 컴포넌트
 * ========================================================= */
const WishList: React.FC = () => {
  const [filter, setFilter] = useState<TriFilterValue>("all");

  // 서버 데이터
  const { data, loading, error } = useWishlist({
    page: 0,
    size: 20,
    sort: "end",
  });

  // ✅ data가 unknown일 수 있으니 확정 타입으로 변환
  const base: TradeItem[] = Array.isArray(data) ? data : [];

  // 진행중 여부 판정 함수 메모
  const isOngoingForItem = useCallback(
    (x: TradeItem) => isOngoingWishlist(x),
    []
  );

  // ✅ counts를 명확한 타입으로 고정 (unknown 방지)
  const counts: { all: number; ongoing: number; ended: number } =
    useMemo(() => {
      const all = base.length;
      const ongoing = base.filter(isOngoingForItem).length;
      const ended = all - ongoing;
      return { all, ongoing, ended };
    }, [base, isOngoingForItem]);

  // 현재 탭(필터)에 맞는 목록
  const filtered: TradeItem[] = useMemo(() => {
    if (filter === "all") return base;
    if (filter === "ongoing") return base.filter(isOngoingForItem);
    return base.filter((x) => !isOngoingForItem(x));
  }, [base, filter, isOngoingForItem]);

  // 공통 정렬(진행군 → 종료군, 같은 군은 마감시각 최근 우선)
  const sorted: TradeItem[] = useMemo(
    () => [...filtered].sort((a, b) => compareTradeItems(a, b)),
    [filtered]
  );

  // 찜 토글 핸들러 (하트)
  const handleToggleLike = (auctionId: number, nextLiked: boolean) => {
    console.log("toggle like", auctionId, nextLiked);
    // TODO:
    //  nextLiked === false -> DELETE /wishs/:auctionId
    //  nextLiked === true  -> POST /wishs
    //  성공 시 refetch or optimistic update
  };

  // 완전히 비어 있는지?
  const isTrulyEmpty = !loading && sorted.length === 0;

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-4 text-2xl font-bold">찜 목록</h2>

      {/* 진행중 / 종료 필터 탭 */}
      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-4"
      />

      {/* 에러 && 데이터 없음 → 에러 문구 */}
      {error && base.length === 0 && (
        <p className="mb-3 text-sm text-red-600">
          찜 목록을 불러오지 못했어요.
        </p>
      )}

      {/* 로딩 중 + 아직 아무 데이터도 없는 경우 */}
      {loading && base.length === 0 ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : isTrulyEmpty ? (
        // 로딩 끝났는데 필터 결과가 비었을 때
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="text-sm text-neutral-500">찜한 항목이 없습니다.</p>
        </div>
      ) : (
        // 실제 목록
        <ul role="list" aria-label="찜한 상품 목록">
          {sorted.map((it, idx) => (
            <TradeRowCompact
              key={it.id ?? idx}
              item={it}
              wishStyle={true} // 오른쪽에 하트 + 가격
              onToggleLike={handleToggleLike}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default WishList;
