// src/features/mypage/pages/SaleList.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../hooks/useSales";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import { isOngoing, compareTradeItems } from "../utils/tradeStatus";
import type { AuctionItem } from "../../auction/types/auctions";

/* =========================
 * 정규화 타입 & 유틸
 * ========================= */
type NormForFilter = {
  id: number | null;
  status: string;
  auctionEnd: string;

  paid?: boolean | null;
  paymentStatus?: string | null;
  settlementStatus?: string | null;
  payStatus?: string | null;
  depositStatus?: string | null;
  resultStatus?: string | null;

  original: AuctionItem | any;
};

const first = <T,>(...vals: (T | null | undefined)[]): T | null =>
  vals.find((v) => v != null) ?? null;

function makeKey(item: NormForFilter, idx: number, scope = "sales") {
  if (item.id != null) return `${scope}:auc:${String(item.id)}`;
  return `${scope}:tmp:${idx}`;
}

const getId = (row: any): number | null => {
  if (typeof row?.auctionId === "number") return row.auctionId;
  if (typeof row?.id === "number") return row.id;
  return null;
};

/* =========================
 * 페이지 사이즈
 * ========================= */
const PAGE_SIZE_FIRST = 10;
const PAGE_SIZE_NEXT = 10;

/* =========================
 * 컴포넌트
 * ========================= */
export default function SaleList() {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const nav = useNavigate();

  // 무한스크롤 상태
  const [page, setPage] = useState(0);
  const [pagesData, setPagesData] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 페이지별 사이즈
  const pageSize = page === 0 ? PAGE_SIZE_FIRST : PAGE_SIZE_NEXT;

  const { data, loading, error } = useSales({
    page,
    size: pageSize,
    sort: "end",
  });

  // 데이터 머지 + 중복 제거
  useEffect(() => {
    if (!data) return;
    const next = [...pagesData];

    const seen = new Set(next.map((d: any) => String(d.auctionId ?? d.id)));
    for (const row of data) {
      const key = String(row.auctionId ?? row.id);
      if (!seen.has(key)) {
        next.push(row);
        seen.add(key);
      }
    }

    setPagesData(next);
    setHasMore(Array.isArray(data) && data.length === pageSize);
    if (!initialLoaded) setInitialLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const isFetchingNext = loading && initialLoaded;

  // ▼▼ 바닥 로더 300ms 지연 표시(깜빡임 방지) ▼▼
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

  /* =========================
   * 1) 원본 → 정규화
   * ========================= */
  const normalizedRaw: NormForFilter[] = useMemo(
    () =>
      (pagesData ?? []).map((it: any) => {
        const id = getId(it);

        const status = (it.sellingStatus ?? it.status ?? "") as string;
        const auctionEnd = (it.endTime ?? it.auctionEnd ?? "") as string;

        const paid =
          typeof it.paid === "boolean"
            ? it.paid
            : it.isPaid === true
              ? true
              : it.paymentDone === true
                ? true
                : null;

        const paymentStatus = first(
          it.paymentStatus,
          it.payStatus,
          it.depositStatus
        );
        const settlementStatus = first(it.settlementStatus);
        const resultStatus = first(it.resultStatus, it.tradeResult);

        return {
          id,
          status,
          auctionEnd,
          paid,
          paymentStatus,
          settlementStatus,
          payStatus: it.payStatus ?? null,
          depositStatus: it.depositStatus ?? null,
          resultStatus,
          original: it,
        } as NormForFilter;
      }),
    [pagesData]
  );

  /* =========================
   * 2) 정규화 중복 제거(id 기준)
   * ========================= */
  const normalized: NormForFilter[] = useMemo(() => {
    const seen = new Set<number>();
    const out: NormForFilter[] = [];
    for (const row of normalizedRaw) {
      if (row.id == null) {
        out.push(row);
        continue;
      }
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
    return out;
  }, [normalizedRaw]);

  /* =========================
   * 카운트
   * ========================= */
  const counts = useMemo(() => {
    const all = normalized.length;
    const ongoing = normalized.filter((d) =>
      isOngoing({
        status: d.status,
        auctionEnd: d.auctionEnd,
        paid: d.paid,
        paymentStatus: d.paymentStatus,
        settlementStatus: d.settlementStatus,
        payStatus: d.payStatus,
        depositStatus: d.depositStatus,
        resultStatus: d.resultStatus,
      } as any)
    ).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [normalized]);

  /* =========================
   * 필터링
   * ========================= */
  const filtered = useMemo(() => {
    if (filter === "all") return normalized;
    const test = (d: NormForFilter) =>
      isOngoing({
        status: d.status,
        auctionEnd: d.auctionEnd,
        paid: d.paid,
        paymentStatus: d.paymentStatus,
        settlementStatus: d.settlementStatus,
        payStatus: d.payStatus,
        depositStatus: d.depositStatus,
        resultStatus: d.resultStatus,
      } as any);
    return filter === "ongoing"
      ? normalized.filter(test)
      : normalized.filter((d) => !test(d));
  }, [normalized, filter]);

  /* =========================
   * 정렬
   * ========================= */
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        compareTradeItems(
          {
            status: a.status,
            auctionEnd: a.auctionEnd,
            paid: a.paid,
            paymentStatus: a.paymentStatus,
            settlementStatus: a.settlementStatus,
            payStatus: a.payStatus,
            depositStatus: a.depositStatus,
            resultStatus: a.resultStatus,
          } as any,
          {
            status: b.status,
            auctionEnd: b.auctionEnd,
            paid: b.paid,
            paymentStatus: b.paymentStatus,
            settlementStatus: b.settlementStatus,
            payStatus: b.payStatus,
            depositStatus: b.depositStatus,
            resultStatus: b.resultStatus,
          } as any
        )
      ),
    [filtered]
  );

  /* =========================
   * 렌더
   * ========================= */
  const renderList = (list: NormForFilter[]) => (
    <ul className="divide-y divide-neutral-200 rounded-lg bg-white">
      {list.map((row, idx) => (
        <TradeRowCompact
          key={makeKey(row, idx, "sales")}
          item={row.original}
          onClick={(clickedId) => nav(`/auctions/${clickedId}`)}
        />
      ))}
    </ul>
  );

  // 스켈레톤
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

  const renderEmptyState = () => (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center sm:min-h-[300px] sm:p-10">
      <p className="text-sm text-gray-600 sm:text-[15px]">
        판매 내역이 없습니다.
      </p>
      <button
        type="button"
        onClick={() => nav("/auctions/new")}
        className="bg-purple hover:bg-deep-purple rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md focus:outline-none sm:text-[15px]"
      >
        경매 등록하기
      </button>
    </div>
  );

  const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8">
      {children}
    </div>
  );

  if (error && !loading && normalized.length === 0) {
    return (
      <Container>
        <h2 className="mb-3 text-xl font-semibold sm:text-2xl">판매 내역</h2>
        <StatusTriFilter
          value={filter}
          onChange={setFilter}
          counts={{ all: 0, ongoing: 0, ended: 0 }}
          className="mb-3 sm:mb-4"
        />
        {renderEmptyState()}
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="mb-3 text-xl font-semibold sm:text-2xl">판매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3 sm:mb-4"
      />

      {!initialLoaded && loading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : sorted.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {renderList(sorted)}
          <div ref={sentinelRef} className="h-[1px]" />
          {/* ▼▼ 지연 스켈레톤 바닥 로더 ▼▼ */}
          {showBottomLoader && (
            <ul
              className="divide-y divide-neutral-200 rounded-lg bg-white"
              aria-busy="true"
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
    </Container>
  );
}
