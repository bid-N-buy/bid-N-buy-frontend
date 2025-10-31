// src/features/mypage/pages/PurchasesPage.tsx
import React, { useMemo, useState } from "react";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import type { TradeItem } from "../types/trade";

import { confirmSettlement } from "../api/confirmSettlement";
import { submitRating } from "../api/rating";

/* =========================================================
 * 별점 모달
 * ========================================================= */
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
                  ? "border-purple-600 text-purple-600"
                  : "border-neutral-300 text-neutral-500 hover:border-purple-400 hover:text-purple-400"
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
                : "border-purple-600 text-purple-600 hover:bg-purple-50"
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

/* =========================================================
 * 결제/정산 판별 & 시간 유틸
 * ========================================================= */
const U = (v?: string | null) => (v ?? "").toString().trim().toUpperCase();

const PAID_KEYWORDS = new Set([
  // 영문
  "PAID",
  "PAY_DONE",
  "DEPOSIT_DONE",
  "SETTLED",
  "SETTLEMENT_DONE",
  "PAYOUT_DONE",
  "SUCCESS",
  "COMPLETED",
  "DONE",
  // 국문 (공백/붙임 모두)
  "결제완료",
  "입금완료",
  "정산완료",
  "거래완료",
  "결제 완료",
  "입금 완료",
  "정산 완료",
  "거래 완료",
]);

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
  "거래 완료",
  "거래완료",
  "정산 완료",
  "정산완료",
]);

const parseMs = (iso?: string | null) => {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
};

const getEndIso = (it: any): string | null =>
  it?.auctionEnd ?? it?.endTime ?? it?.endAt ?? it?.endDate ?? null;

/** 서버에서 내려올 수 있는 완료 시각 후보를 최대한 흡수 (자동 스캔 포함) */
const getPaidAtIso = (it: any): string | null => {
  // 대표 키 우선
  const direct =
    it?.paidAt ??
    it?.paymentAt ??
    it?.depositAt ??
    it?.settlementAt ??
    it?.payoutAt ??
    it?.resultAt ??
    it?.orderCompletedAt ??
    it?.completedAt ??
    it?.updatedAt ??
    null;
  if (direct) return direct;

  // 키 자동 스캔: (paid|pay|deposit|settle|complete|result|payout).*(at|time|date)$
  const re =
    /(paid|pay|deposit|settle|complete|result|payout).*(at|time|date)$/i;
  let bestMs = 0;
  let bestIso: string | null = null;

  for (const k of Object.keys(it ?? {})) {
    if (!re.test(k)) continue;
    const v = (it as any)[k];
    if (typeof v !== "string") continue;
    const ms = Date.parse(v);
    if (Number.isFinite(ms) && ms > bestMs) {
      bestMs = ms;
      bestIso = v;
    }
  }
  return bestIso;
};

/** 서버/로컬 상태를 종합해 결제완료 여부 */
function isPaidDone(it: any, settledMap: Record<string, boolean>): boolean {
  const orderId = (it?.orderId ?? it?.id)?.toString();
  if (orderId && settledMap[orderId]) return true;

  if (
    it?.settled === true ||
    it?.paid === true ||
    it?.isPaid === true ||
    it?.paymentDone === true
  )
    return true;

  const buckets = [
    U(it?.paymentStatus),
    U(it?.settlementStatus),
    U(it?.payStatus),
    U(it?.depositStatus),
    U(it?.resultStatus),
    U(it?.statusText),
    U(it?.status),
    U(it?.state),
  ];

  return buckets.some(
    (x) => x && (PAID_KEYWORDS.has(x) || ENDED_KEYWORDS.has(x))
  );
}

/** 진행중 여부 (결제완료/시간 경과 고려) */
function isOngoing(
  item: TradeItem,
  settledMap: Record<string, boolean>
): boolean {
  if (isPaidDone(item, settledMap)) return false;

  const endIso = getEndIso(item);
  if (endIso) {
    const t = parseMs(endIso);
    if (t && t <= Date.now()) return false;
  }
  return true;
}

/* =========================================================
 * 메인
 * ========================================================= */
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

  // 로컬에서 이미 확정 처리한 주문
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  const { data, loading, error } = usePurchases({
    page: 0,
    size: 20,
    sort: "end",
  });

  const base: TradeItem[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  // 카운트
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter((it) => isOngoing(it, settledMap)).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base, settledMap]);

  // 탭 필터
  const filtered = useMemo(() => {
    if (filter === "ongoing")
      return base.filter((it) => isOngoing(it, settledMap));
    if (filter === "ended")
      return base.filter((it) => !isOngoing(it, settledMap));
    return base;
  }, [base, filter, settledMap]);

  // ✅ 결제 완료 순 정렬:
  // 1) 결제완료(true) 먼저
  // 2) 결제완료끼리는 paidAt 내림차순(최근 결제 우선)
  //    - paidAt 없으면 endAt으로 대체 (최후 보정)
  // 3) 미결제끼리는 endAt 내림차순
  const sorted = useMemo(() => {
    const paidRank = (it: any) => (isPaidDone(it, settledMap) ? 0 : 1);
    const paidAtMs = (it: any) => {
      const fromServer = parseMs(getPaidAtIso(it));
      if (fromServer) return fromServer;
      if (isPaidDone(it, settledMap)) return parseMs(getEndIso(it)); // 결제완료인데 시각없음 → 마감시각 보정
      return 0;
    };
    const endMs = (it: any) => parseMs(getEndIso(it));

    return [...filtered].sort((a, b) => {
      const ra = paidRank(a);
      const rb = paidRank(b);
      if (ra !== rb) return ra - rb;

      if (ra === 0) {
        const pa = paidAtMs(a);
        const pb = paidAtMs(b);
        if (pa !== pb) return pb - pa; // 최근 결제 우선
      }

      const ea = endMs(a);
      const eb = endMs(b);
      return eb - ea; // 미결제끼리는 마감 최근 우선
    });
  }, [filtered, settledMap]);

  // 구매 확정 버튼 노출 여부
  function canShowConfirmButton(item: TradeItem): boolean {
    const orderId = (item as any).orderId ?? item.id;
    const localDone = settledMap[String(orderId)];
    const serverDone =
      isPaidDone(item, settledMap) || (item as any).settled === true;
    return !(localDone || serverDone);
  }

  // 구매 확정 → 별점 모달
  function handleRequestConfirm(orderId: number | string) {
    setReviewTargetId(orderId);
    setRating(10);
    setReviewModalOpen(true);
  }

  // 별점 제출 + 정산
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
    } catch (err) {
      console.error("[구매 확정/리뷰 실패]", err);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setSubmittingReview(false);
      setConfirmingId(null);
      setReviewModalOpen(false);
      setReviewTargetId(null);
    }
  }

  const renderList = (list: TradeItem[]) => (
    <ul className="divide-y divide-neutral-200">
      {list.map((it) => {
        const orderId = (it as any).orderId ?? it.id;
        const settled = !!settledMap[String(orderId)];
        return (
          <TradeRowCompact
            key={String(it.id)}
            item={{
              ...it,
              statusText: settled ? "거래 완료" : (it as any).statusText,
            }}
            canConfirm={canShowConfirmButton(it)}
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
        className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-purple-500/50 hover:brightness-110 focus:ring-2 focus:ring-purple-400 focus:outline-none"
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
        counts={{
          all: counts.all,
          ongoing: counts.ongoing,
          ended: counts.ended,
        }}
        className="mb-3"
      />

      {loading ? (
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
        renderList(sorted)
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
