// src/features/mypage/pages/PurchasesPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import type { TradeItem } from "../types/trade";
import { confirmSettlement } from "../api/confirmSettlement";
import { submitRating } from "../api/rating";

/* ---------- 별점 모달 ---------- */
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
      <div className="w-[320px] rounded-lg bg-white p-4 shadow-lg">
        <h3 className="mb-3 text-base font-semibold text-neutral-900">
          구매 확정 & 별점 주기
        </h3>
        <p className="mb-2 text-sm text-neutral-600">
          이번 거래는 만족하셨나요?
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
            <button
              key={score}
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded border text-sm font-semibold ${
                score === rating
                  ? "border-purple text-purple"
                  : "hover:border-purple hover:text-purple border-neutral-300 text-neutral-500"
              }`}
              onClick={() => onChangeRating(score)}
              disabled={submitting}
              aria-label={`${score}점`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 text-sm">
          <button
            type="button"
            className="rounded border border-neutral-300 px-3 py-1 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40"
            onClick={onCancel}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="button"
            className={`rounded border px-3 py-1 font-semibold disabled:opacity-40 ${
              submitting
                ? "cursor-not-allowed border-neutral-300 bg-neutral-100 text-neutral-400"
                : "border-purple text-purple hover:bg-deep-purple"
            }`}
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "전송 중..." : "제출"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- 유틸 ---------- */
const U = (v?: string | null) => (v ?? "").toString().trim().toUpperCase();

const ENDED_KEYWORDS = new Set([
  "FINISH",
  "FINISHED",
  "END",
  "ENDED",
  "CANCEL",
  "CANCELED",
  "CANCELLED",
  "유찰",
  "종료",
  "마감",
]);

/** ✅ '정산/거래완료'에만 한정(모호한 COMPLETED/DONE 제거) */
const SETTLED_KEYWORDS = new Set([
  "SETTLED",
  "SETTLEMENT_DONE",
  "PAYOUT_DONE",
  "정산완료",
  "거래완료",
  "구매확정",
  "수취완료",
]);

const parseMs = (iso?: string | null) => {
  if (!iso) return 0;
  const s = iso.includes(" ") ? iso.replace(" ", "T") : iso;
  const t = Date.parse(s);
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

const getPaidAtIso = (it: any): string | null =>
  it?.paidAt ??
  it?.paymentAt ??
  it?.depositAt ??
  it?.settlementAt ??
  it?.payoutAt ??
  it?.orderCompletedAt ??
  it?.completedAt ??
  null;

function isSettledOrDone(
  it: any,
  settledMap: Record<string, boolean>
): boolean {
  const orderId = (it?.orderId ?? it?.id)?.toString();
  if (orderId && settledMap[orderId]) return true;

  // 명시 플래그
  if (it?.settled === true || it?.isPaid === true || it?.paymentDone === true)
    return true;

  // 상태 문자열에서만 엄격 판정
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
  return buckets.some((x) => x && SETTLED_KEYWORDS.has(x));
}

function isEndedByTime(it: TradeItem): boolean {
  const endIso = getEndIso(it);
  if (!endIso) return false;
  const t = parseMs(endIso);
  return t !== 0 && t <= Date.now();
}

/** 진행중: 아직 정산 안 됨 && (마감시간이 없거나 미래) */
function isOngoing(
  item: TradeItem,
  settledMap: Record<string, boolean>
): boolean {
  if (isSettledOrDone(item, settledMap)) return false;
  const endIso = getEndIso(item);
  if (!endIso) return true;
  return parseMs(endIso) > Date.now();
}

/* ---------- 메인 (무한스크롤) ---------- */
const PAGE_SIZE = 20;

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

  // 로컬 확정 맵
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  // 무한스크롤 상태
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<TradeItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 현재 페이지 데이터만 호출
  const { data, loading, error } = usePurchases({
    page,
    size: PAGE_SIZE,
    sort: "end",
  });

  // 페이지 누적
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
    setHasMore(Array.isArray(data) && data.length === PAGE_SIZE);
    if (!initialLoaded) setInitialLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // 센티넬
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingNext = loading && initialLoaded;

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

  // 카운트
  const counts = useMemo(() => {
    const all = items.length;
    const ongoing = items.filter((it) => isOngoing(it, settledMap)).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [items, settledMap]);

  // 탭 필터
  const filtered = useMemo(() => {
    if (filter === "ongoing")
      return items.filter((it) => isOngoing(it, settledMap));
    if (filter === "ended")
      return items.filter((it) => !isOngoing(it, settledMap));
    return items;
  }, [items, filter, settledMap]);

  // 정렬
  const sorted = useMemo(() => {
    const rank = (it: TradeItem) => (isSettledOrDone(it, settledMap) ? 0 : 1);
    const paidAtMs = (it: TradeItem) => parseMs(getPaidAtIso(it));
    const endMs = (it: TradeItem) => parseMs(getEndIso(it));
    return [...filtered].sort((a, b) => {
      const ra = rank(a),
        rb = rank(b);
      if (ra !== rb) return ra - rb; // 정산완료 먼저
      if (ra === 0) {
        const pa = paidAtMs(a),
          pb = paidAtMs(b);
        if (pa !== pb) return pb - pa; // 정산완료끼리는 최근 우선
      }
      // 그 외는 마감 임박 우선
      return endMs(b) - endMs(a);
    });
  }, [filtered, settledMap]);

  /** ✅ 버튼 노출: "마감 지남 && 아직 정산 아님" */
  function canShowConfirmButton(item: TradeItem): boolean {
    const notSettled = !isSettledOrDone(item, settledMap);
    const auctionEnded = isEndedByTime(item);
    return notSettled && auctionEnded;
  }

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

  // 표시용 statusText 보정
  const displayStatus = (it: TradeItem): string => {
    if (isSettledOrDone(it, settledMap)) return "거래 완료";
    if (isEndedByTime(it)) return "종료";
    return "진행 중";
  };

  const renderList = (list: TradeItem[]) => (
    <ul className="divide-y divide-neutral-200">
      {list.map((it) => {
        const orderId = (it as any).orderId ?? it.id;
        const showConfirm = canShowConfirmButton(it);

        return (
          <TradeRowCompact
            key={String(it.id)}
            item={{
              ...it,
              // ✅ statusText가 비어 있어도 보정해서 전달
              statusText: it.statusText ?? displayStatus(it),
            }}
            canConfirm={showConfirm}
            confirming={confirmingId === orderId}
            onConfirmClick={handleRequestConfirm}
            onClick={() => {}}
          />
        );
      })}
    </ul>
  );

  const renderEmptyState = () => (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <p className="text-sm text-neutral-500">구매 내역이 없습니다.</p>
      <button
        type="button"
        onClick={() => (window.location.href = "/auctions")}
        className="bg-purple hover:bg-deep-purple rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md"
      >
        지금 구경하러 가기
      </button>
    </div>
  );

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
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
