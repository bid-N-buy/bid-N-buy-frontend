// src/features/mypage/pages/PurchasesPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import type { TradeItem } from "../types/trade";
import { confirmSettlement } from "../api/confirmSettlement";
import { submitRating } from "../api/rating";

/* ---------- 별점 모달 (포탈 + 이벤트 차단) ---------- */
type RatingModalProps = {
  open: boolean;
  rating: number;
  onChangeRating: (n: number) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting?: boolean;
};

const RatingModal: React.FC<RatingModalProps> = ({
  open,
  rating,
  onChangeRating,
  onCancel,
  onSubmit,
  submitting = false,
}) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let root = document.getElementById("modal-root") as HTMLElement | null;
    if (!root) {
      root = document.createElement("div");
      root.id = "modal-root";
      document.body.appendChild(root);
    }
    setMountNode(root);
  }, []);

  if (!open || !mountNode) return null;

  const modal = (
    <div
      className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="pointer-events-auto w-[92vw] max-w-[420px] rounded-xl bg-white p-4 shadow-lg sm:max-w-[500px] sm:p-5"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-base font-semibold text-neutral-900 sm:text-lg">
          구매 확정 & 별점 주기
        </h3>
        <p className="mb-3 text-sm text-neutral-600 sm:text-[15px]">
          이번 거래는 만족하셨나요?
        </p>

        <div className="mb-4 flex flex-wrap gap-2 sm:gap-2.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
            const selected = score === rating;
            return (
              <button
                key={score}
                type="button"
                className={[
                  "flex h-8 w-8 items-center justify-center rounded border text-sm font-semibold select-none sm:h-9 sm:w-9",
                  selected
                    ? "border-purple text-purple"
                    : "hover:border-purple hover:text-purple text-purple border-neutral-300",
                ].join(" ")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!submitting) onChangeRating(score);
                }}
                disabled={submitting}
                aria-label={`${score}점`}
              >
                {score}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 text-sm sm:text-[15px]">
          <button
            type="button"
            className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
            onClick={(e) => {
              e.stopPropagation();
              if (!submitting) onCancel();
            }}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="button"
            className={[
              "rounded border px-3 py-1.5 font-semibold disabled:opacity-40",
              submitting
                ? "cursor-not-allowed border-neutral-300 bg-neutral-100 text-neutral-400"
                : "border-purple text-purple hover:bg-deep-purple hover:text-white",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              if (!submitting) onSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? "전송 중..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, mountNode);
};

/* ---------- 판정 유틸 ---------- */
const U = (v?: string | null) => (v ?? "").toString().trim().toUpperCase();

const normIso = (s?: string | null) => {
  if (!s) return undefined;
  const t = s.trim();
  return /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(t)
    ? t.replace(/\s+/, "T")
    : t;
};
const parseMs = (iso?: string | null) => {
  const n = normIso(iso);
  if (!n) return 0;
  const t = Date.parse(n);
  return Number.isFinite(t) ? t : 0;
};
const getEndIso = (it: any): string | null =>
  it?.auctionEnd ??
  it?.endTime ??
  it?.endAt ??
  it?.deadline ??
  it?.deadlineAt ??
  it?.endDate ??
  null;

const SETTLED_HINTS = new Set([
  "구매확정",
  "수취완료",
  "정산",
  "SETTLED",
  "SETTLEMENT_DONE",
  "PAYOUT_DONE",
  "PURCHASE_CONFIRMED",
]);
function hasSettledHint(text?: string) {
  const up = U(text);
  if (!up) return false;
  return Array.from(SETTLED_HINTS).some((kw) => up.includes(kw));
}

function isSettledOrDone(
  it: any,
  settledMap: Record<string, boolean>
): boolean {
  const orderId = (it?.orderId ?? it?.id)?.toString();
  if (orderId && settledMap[orderId]) return true;

  if (it?.settled === true || it?.isPaid === true || it?.paymentDone === true)
    return true;

  const buckets = [
    U(it?.settlementStatus),
    U(it?.paymentStatus),
    U(it?.payStatus),
    U(it?.depositStatus),
    U(it?.resultStatus),
    U(it?.statusText),
    U(it?.status),
    U(it?.state),
  ];
  return buckets.some((x) => x && hasSettledHint(x));
}

function isEndedByTime(item: TradeItem): boolean {
  const endIso = getEndIso(item);
  if (!endIso) return false;
  const t = parseMs(endIso);
  return t !== 0 && t <= Date.now();
}

/** 버튼 표시 정책:
 * notSettled && ( ended || hasSettledHint || hasOrderId )
 */
function canShowConfirmButton(
  item: TradeItem,
  settledMap: Record<string, boolean>
): boolean {
  const notSettled = !isSettledOrDone(item, settledMap);
  const ended = isEndedByTime(item);
  const hasOrderId = (item as any).orderId != null;

  if (!notSettled) return false;
  if (ended) return true;
  if (hasSettledHint(item.statusText)) return true;
  if (hasOrderId) return true;
  return false;
}

/* ---------- 메인 (무한스크롤: 첫 20개, 이후 10개) ---------- */
const PAGE_SIZE_FIRST = 10;
const PAGE_SIZE_NEXT = 10;

const PurchasesPage: React.FC = () => {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const [confirmingId, setConfirmingId] = useState<string | number | null>(
    null
  );
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<string | number | null>(
    null
  );
  const [rating, setRating] = useState<number>(10);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  const [page, setPage] = useState(0);
  const [items, setItems] = useState<TradeItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // ✅ 페이지별 사이즈 분기
  const pageSize = page === 0 ? PAGE_SIZE_FIRST : PAGE_SIZE_NEXT;

  const { data, loading, error } = usePurchases({
    page,
    size: pageSize,
    sort: "end",
  });

  useEffect(() => {
    if (!data) return;
    const next = [...items];
    const seen = new Set(next.map((d) => String((d as any).id)));
    for (const row of data) {
      const key = String((row as any).id);
      if (!seen.has(key)) {
        next.push(row);
        seen.add(key);
      }
    }
    setItems(next);
    // ✅ pageSize 기준으로 hasMore 결정
    setHasMore(Array.isArray(data) && data.length === pageSize);
    if (!initialLoaded) setInitialLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingNext = loading && initialLoaded;

  // ▼▼ 지연 바닥 로더 표시 (300ms 이후에만) ▼▼
  const [showBottomLoader, setShowBottomLoader] = useState(false);
  useEffect(() => {
    if (!isFetchingNext) {
      setShowBottomLoader(false);
      return;
    }
    const t = setTimeout(() => setShowBottomLoader(true), 300);
    return () => clearTimeout(t);
  }, [isFetchingNext]);

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

  useEffect(() => {
    const probe = items.slice(0, 3);
    probe.forEach((it, i) => {
      const endIso = getEndIso(it);
      const ended = isEndedByTime(it);
      const settled = isSettledOrDone(it, settledMap);
      console.log(
        `[PURCHASE#${i}] id=${it.id} orderId=${(it as any).orderId} end=`,
        endIso,
        " ended=",
        ended,
        " settled=",
        settled,
        " statusText=",
        it.statusText
      );
    });
  }, [items, settledMap]);

  const counts = useMemo(() => {
    const all = items.length;
    const ongoing = items.filter(
      (it) => !isSettledOrDone(it, settledMap) && !isEndedByTime(it)
    ).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [items, settledMap]);

  const filtered = useMemo(() => {
    if (filter === "ongoing")
      return items.filter(
        (it) => !isSettledOrDone(it, settledMap) && !isEndedByTime(it)
      );
    if (filter === "ended")
      return items.filter(
        (it) => isSettledOrDone(it, settledMap) || isEndedByTime(it)
      );
    return items;
  }, [items, filter, settledMap]);

  const sorted = useMemo(() => {
    const rank = (it: TradeItem) => (isSettledOrDone(it, settledMap) ? 0 : 1);
    const paidAtMs = (it: any) =>
      parseMs(
        it?.paidAt ??
          it?.paymentAt ??
          it?.depositAt ??
          it?.settlementAt ??
          it?.payoutAt ??
          it?.orderCompletedAt ??
          it?.completedAt ??
          null
      );
    const endMs = (it: any) => parseMs(getEndIso(it));
    return [...filtered].sort((a, b) => {
      const ra = rank(a),
        rb = rank(b);
      if (ra !== rb) return ra - rb;
      if (ra === 0) {
        const pa = paidAtMs(a),
          pb = paidAtMs(b);
        if (pa !== pb) return pb - pa;
      }
      return endMs(b) - endMs(a);
    });
  }, [filtered, settledMap]);

  function handleRequestConfirm(orderId: number | string) {
    setReviewTargetId(orderId);
    setRating(10);
    setReviewModalOpen(true);
  }

  async function finalizeConfirmAndReview() {
    if (!reviewTargetId) return;
    try {
      setSubmittingReview(true);
      setConfirmingId(reviewTargetId);
      await submitRating(reviewTargetId, rating);
      await confirmSettlement(reviewTargetId);
      setSettledMap((prev) => ({ ...prev, [String(reviewTargetId)]: true }));
      setFilter("ended");
      alert("구매 확정이 완료되었어요! ⭐");
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setSubmittingReview(false);
      setConfirmingId(null);
      setReviewModalOpen(false);
      setReviewTargetId(null);
    }
  }

  const displayStatus = (it: TradeItem): string => {
    if (isSettledOrDone(it, settledMap)) return "거래 완료";
    if (isEndedByTime(it)) return "종료";
    return "진행 중";
  };

  const renderList = (list: TradeItem[]) => (
    <ul className="divide-y divide-neutral-200 rounded-lg bg-white">
      {list.map((it) => {
        const orderId = (it as any).orderId ?? it.id;
        const showConfirm = canShowConfirmButton(it, settledMap);

        return (
          <TradeRowCompact
            key={String(it.id)}
            item={{ ...it, statusText: displayStatus(it) }}
            canConfirm={showConfirm}
            confirming={confirmingId === orderId}
            onConfirmClick={handleRequestConfirm}
            onClick={() => {}}
          />
        );
      })}
    </ul>
  );

  // ▼▼ 로딩 스켈레톤 (TradeRowCompact 높이에 맞춤) ▼▼
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
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center sm:min-h-[300px] sm:p-10">
      <p className="text-sm text-neutral-500 sm:text-[15px]">
        구매 내역이 없습니다.
      </p>
      <button
        type="button"
        onClick={() => (window.location.href = "/auctions")}
        className="bg-purple hover:bg-deep-purple rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md sm:text-[15px]"
      >
        지금 구경하러 가기
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8">
      <h2 className="mb-3 text-xl font-semibold sm:text-2xl">구매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3 sm:mb-4"
      />

      {!initialLoaded && loading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error && sorted.length === 0 ? (
        <>
          <p className="text-sm text-red-500">
            구매 내역을 불러오지 못했습니다.
          </p>
          <div className="mt-4">{renderEmptyState()}</div>
        </>
      ) : sorted.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {renderList(sorted)}
          <div ref={sentinelRef} className="h-[1px]" />
          {/* ▼▼ 지연 스켈레톤 로더 (바닥) ▼▼ */}
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

      <RatingModal
        open={reviewModalOpen}
        rating={rating}
        onChangeRating={setRating}
        onCancel={() => {
          if (submittingReview) return;
          setReviewModalOpen(false);
          setReviewTargetId(null);
        }}
        onSubmit={finalizeConfirmAndReview}
        submitting={submittingReview}
      />
    </div>
  );
};

export default PurchasesPage;
