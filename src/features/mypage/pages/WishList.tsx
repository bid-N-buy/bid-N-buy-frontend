// src/features/mypage/pages/WishList.tsx
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
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

/** 위시리스트용 진행/종료 판정 */
function isOngoingWishlist(item: TradeItem): boolean {
  if (isEndedByTime((item as any)?.auctionEnd)) return false;
  if (isEndedLikeText(item)) return false;
  return isOngoingCore(item);
}

/* ---------------------------------------------
 * 키/아이디 유틸
 * --------------------------------------------- */
const getWishId = (row: any): number | null => {
  if (typeof row?.auctionId === "number") return row.auctionId;
  if (typeof row?.id === "number") return row.id;
  return null;
};
const makeKey = (row: any, idx: number, scope = "wish") => {
  const id = getWishId(row);
  return id != null ? `${scope}:auc:${id}` : `${scope}:tmp:${idx}`;
};

/* =========================================================
 * 컴포넌트
 * ========================================================= */
const PAGE_SIZE_FIRST = 10;
const PAGE_SIZE_NEXT = 10;

const WishList: React.FC = () => {
  const [filter, setFilter] = useState<TriFilterValue>("all");

  // 무한스크롤 상태
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<TradeItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 페이지별 size
  const pageSize = page === 0 ? PAGE_SIZE_FIRST : PAGE_SIZE_NEXT;

  const { data, loading, error } = useWishlist({
    page,
    size: pageSize,
    sort: "end",
  });

  // 새 데이터 합치기 (중복 방지)
  useEffect(() => {
    if (!data) return;
    const next = [...items];
    const seen = new Set(
      next.map((d) => String((d as any).auctionId ?? (d as any).id))
    );
    for (const row of data) {
      const key = String((row as any).auctionId ?? (row as any).id);
      if (!seen.has(key)) {
        next.push(row);
        seen.add(key);
      }
    }
    setItems(next);
    setHasMore(Array.isArray(data) && data.length === pageSize);
    if (!initialLoaded) setInitialLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const isFetchingNext = loading && initialLoaded;

  // ▼▼ 바닥 로더 300ms 지연 표시(깜빡임 방지)
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  useEffect(() => {
    if (!isFetchingNext) {
      setShowBottomLoader(false);
      return;
    }
    const t = setTimeout(() => setShowBottomLoader(true), 300);
    return () => clearTimeout(t);
  }, [isFetchingNext]);

  // IntersectionObserver
  useEffect(() => {
    if (!hasMore || isFetchingNext) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setPage((p) => p + 1),
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isFetchingNext]);

  // 진행중 여부 판정 메모
  const isOngoingForItem = useCallback(
    (x: TradeItem) => isOngoingWishlist(x),
    []
  );

  // counts
  const counts = useMemo(() => {
    const all = items.length;
    const ongoing = items.filter(isOngoingForItem).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [items, isOngoingForItem]);

  // 현재 탭(필터)
  const filtered: TradeItem[] = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "ongoing") return items.filter(isOngoingForItem);
    return items.filter((x) => !isOngoingForItem(x));
  }, [items, filter, isOngoingForItem]);

  // 정렬 (공통)
  const sorted: TradeItem[] = useMemo(
    () => [...filtered].sort((a, b) => compareTradeItems(a, b)),
    [filtered]
  );

  // 찜 토글 (하트)
  const handleToggleLike = (auctionId: number, nextLiked: boolean) => {
    // TODO:
    //  nextLiked === false -> DELETE /wishs/:auctionId
    //  nextLiked === true  -> POST /wishs
    //  성공 시 refetch or optimistic update
  };

  const isTrulyEmpty = !loading && sorted.length === 0 && items.length === 0;

  // 스켈레톤 로우
  const RowSkeleton: React.FC = () => (
    <li className="animate-pulse px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-lg bg-neutral-200" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 h-3 w-3/4 rounded bg-neutral-200" />
          <div className="h-3 w-2/5 rounded bg-neutral-200" />
        </div>
        <div className="h-4 w-4 rounded bg-neutral-200" />
      </div>
    </li>
  );

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-4 text-2xl font-bold">찜 목록</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-4"
      />

      {!initialLoaded && loading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : isTrulyEmpty ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="text-sm text-neutral-500">찜한 항목이 없습니다.</p>
        </div>
      ) : (
        <>
          <ul
            role="list"
            aria-label="찜한 상품 목록"
            className="divide-y divide-neutral-200 rounded-lg bg-white"
          >
            {sorted.map((it, idx) => (
              <TradeRowCompact
                key={makeKey(it, idx, "wish")}
                item={it}
                wishStyle={true}
                onToggleLike={handleToggleLike}
              />
            ))}
          </ul>

          <div ref={sentinelRef} className="h-[1px]" />

          {/* ▼▼ 지연 스켈레톤 바닥 로더 ▼▼ */}
          {showBottomLoader && (
            <ul
              className="divide-y divide-neutral-200 rounded-lg bg-white"
              aria-busy="true"
              aria-live="polite"
            >
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </ul>
          )}

          {!hasMore && initialLoaded && (
            <div className="py-4 text-center text-xs text-neutral-400">
              마지막 페이지입니다
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WishList;
