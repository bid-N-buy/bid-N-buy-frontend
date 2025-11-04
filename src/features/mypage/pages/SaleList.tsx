// src/features/mypage/pages/WishList.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useWishlist } from "../hooks/useWishlist";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, { type TriFilterValue } from "../components/filters/StatusTriFilter";
import type { TradeItem } from "../types/trade";

/* =========================================================
 * 날짜/상태 유틸
 * ========================================================= */
const U = (v?: string | null) => (v ?? "").toString().trim().toUpperCase();

const ENDED_KEYWORDS = new Set([
  "COMPLETE","COMPLETED","FINISH","FINISHED","END","ENDED",
  "CANCEL","CANCELED","CANCELLED","FAIL","FAILED","DONE",
  // 한글
  "거래 완료","거래완료","종료","판매 종료","판매종료","유찰",
  "낙찰","구매확정","정산완료","수취완료", // ✅ 추가: 완료류 한국어 키워드 보강
]);

const ONGOING_KEYWORDS = new Set([
  "SALE","SELLING","BIDDING","입찰","판매중","ON_SALE","RUNNING",
  "PROGRESS","IN PROGRESS","진행중","결제","배송","발송","PROCESS","SHIP","PAID","PAY",
  "OPEN","START","STARTED" // ✅ '오픈/시작' 류 보강
]);

/** "YYYY-MM-DD HH:mm[:ss]" → "YYYY-MM-DDTHH:mm[:ss]" 로컬 시간 파싱
 *  Safari/Firefox 호환 & "YYYY/MM/DD HH:mm" 도 커버
 */
const normalizeDate = (s?: string) => {
  if (!s) return undefined;
  const t = s.trim()
    .replace(/\//g, "-")            // ✅ 2025/11/29 → 2025-11-29
    .replace(/\.\d{3}Z?$/, "");     // strip ms if any
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(t)
    ? t.replace(" ", "T")
    : t;
};

const toMs = (v?: string) => {
  const s = normalizeDate(v);
  if (!s) return NaN;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : NaN;
};

const endedByTime = (it: TradeItem) => {
  const end = toMs((it as any).auctionEnd);
  return Number.isFinite(end) && end <= Date.now();
};

const endedByStatus = (it: TradeItem) => {
  const cands = [
    (it as any)?.statusText,
    (it as any)?.status,
    (it as any)?.state,
  ].map(U).filter(Boolean);
  return cands.some((txt) =>
    Array.from(ENDED_KEYWORDS).some((kw) => txt.includes(U(kw)))
  );
};

const ongoingByStatus = (it: TradeItem) => {
  const cands = [
    (it as any)?.statusText,
    (it as any)?.status,
    (it as any)?.state,
  ].map(U).filter(Boolean);
  return cands.some((txt) =>
    Array.from(ONGOING_KEYWORDS).some((kw) => txt.includes(U(kw)))
  );
};

const isEndedWishlist = (it: TradeItem) => endedByTime(it) || endedByStatus(it);

/** 진행중 정책 */
const isOngoingWishlist = (it: TradeItem): boolean => {
  if (isEndedWishlist(it)) return false;

  const s = toMs((it as any).auctionStart);
  const e = toMs((it as any).auctionEnd);
  const now = Date.now();

  if (Number.isFinite(s) && Number.isFinite(e)) return s <= now && now < e;
  if (Number.isFinite(s) && !Number.isFinite(e)) return s <= now;

  // ✅ 시작시간 없으면 진행중 제외(기본 정책)
  return false;

  // 👉 상태문구 기반으로 진행중을 인정하려면 윗줄 대신 아래 라인으로 교체
  // return ongoingByStatus(it);
};

/** 진행중 우선, 같은 군에서는 마감시각 최신 우선 */
function compareTradeItems(a: TradeItem, b: TradeItem) {
  const aOn = isOngoingWishlist(a);
  const bOn = isOngoingWishlist(b);
  if (aOn && !bOn) return -1;
  if (!aOn && bOn) return 1;

  const ta = toMs((a as any).auctionEnd);
  const tb = toMs((b as any).auctionEnd);

  if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;

  // ✅ 보조 정렬: end 없으면 start 기준
  const sa = toMs((a as any).auctionStart);
  const sb = toMs((b as any).auctionStart);
  if (Number.isFinite(sa) && Number.isFinite(sb)) return sb - sa;

  // 최후 fallback: id string 비교 (안 겹치도록)
  return String((b as any).id).localeCompare(String((a as any).id));
}

/* =========================================================
 * 무한 스크롤 적용 본문
 * ========================================================= */
const PAGE_SIZE = 20;

const WishList: React.FC = () => {
  const [filter, setFilter] = useState<TriFilterValue>("all");

  // ▼▼▼ 무한 스크롤 핵심 상태 ▼▼▼
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<TradeItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 현재 페이지 분량만 호출
  const { data, loading, error } = useWishlist({
    page,
    size: PAGE_SIZE,
    sort: "end",
  });

  // 결과 누적(중복 id 제거)
  useEffect(() => {
    if (!data) return;
    setItems((prev) => {
      const seen = new Set(prev.map((d) => String((d as any).id)));
      const merged: TradeItem[] = [...prev];
      for (const row of data) {
        const key = String((row as any).id ?? "");
        if (!key) continue; // ✅ id 없으면 스킵
        if (!seen.has(key)) {
          merged.push(row);
          seen.add(key);
        }
      }
      return merged;
    });

    // ✅ hasMore: == 대신 >= (서버가 마지막에 size 초과 반환하거나 중복이 섞여도 안전)
    setHasMore(Array.isArray(data) && data.length >= PAGE_SIZE);
    if (!initialLoaded) setInitialLoaded(true);
  }, [data, initialLoaded]);

  // 필요하다면 필터 변경 시 서버 재조회(지금은 누적에서 필터링)
  // useEffect(() => {
  //   setPage(0);
  //   setItems([]);
  //   setHasMore(true);
  //   setInitialLoaded(false);
  // }, [filter]);

  // 센티넬 관찰자
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingNext = loading && initialLoaded;

  useEffect(() => {
    if (!hasMore || isFetchingNext) return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const last = entries[0];
        if (last.isIntersecting) {
          // ✅ 연속 증분 방지: 한 번 증가시키면 잠깐 관찰 해제 후 재관찰
          setPage((p) => p + 1);
          obs.unobserve(el);
          setTimeout(() => obs.observe(el), 0);
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isFetchingNext]);

  const counts = useMemo(() => {
    const all = items.length;
    const ongoing = items.filter(isOngoingWishlist).length;
    const ended = items.filter(isEndedWishlist).length;
    return { all, ongoing, ended };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "ongoing") return items.filter(isOngoingWishlist);
    return items.filter(isEndedWishlist);
  }, [items, filter]);

  const sorted = useMemo(() => [...filtered].sort(compareTradeItems), [filtered]);

  const handleToggleLike = () => {};

  const showInitialLoading = !initialLoaded && loading;
  const isTrulyEmpty = !showInitialLoading && sorted.length === 0;

  // ✅ 개발 모드 디버그: 실제 분류 상태 확인용 (원하면 주석 해제)
  // if (import.meta.env.MODE !== "production") {
  //   console.table(sorted.map((it) => ({
  //     id: (it as any).id,
  //     start: (it as any).auctionStart,
  //     end: (it as any).auctionEnd,
  //     status: (it as any).statusText ?? (it as any).status,
  //     endedByTime: endedByTime(it),
  //     endedByStatus: endedByStatus(it),
  //     isEnded: isEndedWishlist(it),
  //     isOngoing: isOngoingWishlist(it),
  //   })));
  // }

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-4 text-2xl font-bold">찜 목록</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-4"
      />

      {error && items.length === 0 && (
        <p className="mb-3 text-sm text-red-600">찜 목록을 불러오지 못했어요.</p>
      )}

      {showInitialLoading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : isTrulyEmpty ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
          <p className="text-sm text-neutral-500">찜한 항목이 없습니다.</p>
        </div>
      ) : (
        <>
          <ul role="list" aria-label="찜한 상품 목록">
            {sorted.map((it, idx) => (
              <TradeRowCompact
                key={String((it as any).id ?? idx)} // ✅ id 누락 대비
                item={it}
                wishStyle={true}
                onToggleLike={handleToggleLike}
              />
            ))}
          </ul>

          {/* 무한 스크롤 센티넬 */}
          <div ref={sentinelRef} className="h-[1px]" />

          {/* 추가 로딩/마지막 표시 */}
          {isFetchingNext && (
            <div className="py-4 text-center text-sm text-neutral-500">
              추가 로딩 중…
            </div>
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
