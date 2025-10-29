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

        {/* 별점 1~10 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, idx) => idx + 1).map((score) => (
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

        {/* 액션 */}
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
 * 진행중 여부 판별
 * ========================================================= */
function isOngoing(
  item: TradeItem,
  settledMap: Record<string, boolean>
): boolean {
  const orderId = (item as any).orderId ?? item.id;
  if (settledMap[String(orderId)]) {
    // 내가 방금 구매확정을 눌러 완료 처리한 건 진행중 취급 X
    return false;
  }

  const rawStatus =
    (item as any)?.statusText ??
    (item as any)?.status ??
    (item as any)?.state ??
    "";

  const txt = String(rawStatus).toUpperCase();

  // 완료/종료/취소 등 단어가 들어가면 진행중 아님
  if (
    txt.includes("COMPLETE") ||
    txt.includes("COMPLETED") ||
    txt.includes("FINISH") ||
    txt.includes("FINISHED") ||
    txt.includes("END") ||
    txt.includes("ENDED") ||
    txt.includes("CANCEL") ||
    txt.includes("CANCELLED") ||
    txt.includes("FAIL") ||
    txt.includes("FAILED") ||
    txt.includes("DONE") ||
    txt.includes("거래 완료") ||
    txt.includes("정산 완료")
  ) {
    return false;
  }

  // 마감 시간이 이미 지났으면 진행중 아님
  const endIso =
    (item as any)?.auctionEnd ??
    (item as any)?.endTime ??
    (item as any)?.endAt ??
    (item as any)?.endDate ??
    null;

  if (endIso) {
    const t = Date.parse(endIso);
    if (Number.isFinite(t) && t <= Date.now()) {
      return false;
    }
  }

  // 위 조건에 안 걸리면 진행중
  return true;
}

const PurchasesPage: React.FC = () => {
  // 탭 상태: "all" | "ongoing" | "ended"
  const [filter, setFilter] = useState<TriFilterValue>("all");

  // 구매확정 처리 중인 orderId
  const [confirmingId, setConfirmingId] = useState<string | number | null>(
    null
  );

  // 별점 모달 상태
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState<string | number | null>(
    null
  );
  const [rating, setRating] = useState<number>(10);
  const [submittingReview, setSubmittingReview] = useState(false);

  // 이미 정산(구매확정)한 orderId들을 로컬에 저장해서 UI에 즉시 반영
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  // 실제 구매내역 데이터만 사용 (mock 없음)
  const { data, loading, error } = usePurchases({
    page: 0,
    size: 20,
    sort: "end",
  });

  const base: TradeItem[] = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  // 카운트 뽑기
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter((it) => isOngoing(it, settledMap)).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base, settledMap]);

  // 탭 필터링
  const filtered = useMemo(() => {
    switch (filter) {
      case "ongoing":
        return base.filter((it) => isOngoing(it, settledMap));
      case "ended":
        return base.filter((it) => !isOngoing(it, settledMap));
      case "all":
      default:
        return base;
    }
  }, [base, filter, settledMap]);

  // 정렬 (진행중 먼저, 같은 그룹끼리는 종료시각이 더 최근인 순)
  const sorted = useMemo(() => {
    const getEndMs = (it: TradeItem) => {
      const iso =
        (it as any)?.auctionEnd ??
        (it as any)?.endTime ??
        (it as any)?.endAt ??
        (it as any)?.endDate ??
        null;
      const t = iso ? Date.parse(iso) : 0;
      return Number.isFinite(t) ? t : 0;
    };

    return [...filtered].sort((a, b) => {
      const aOngoing = isOngoing(a, settledMap);
      const bOngoing = isOngoing(b, settledMap);

      if (aOngoing && !bOngoing) return -1;
      if (!aOngoing && bOngoing) return 1;

      return getEndMs(b) - getEndMs(a);
    });
  }, [filtered, settledMap]);

  // 구매 확정 버튼 노출 여부
  function canShowConfirmButton(item: TradeItem): boolean {
    const orderId = (item as any).orderId ?? item.id;
    const localDone = settledMap[String(orderId)];
    const serverDone = (item as any).settled === true;

    if (localDone || serverDone) return false;
    return true;
  }

  // 구매 확정 누르면 → 별점 모달 열기
  function handleRequestConfirm(orderId: number | string) {
    setReviewTargetId(orderId);
    setRating(10); // 기본 10점
    setReviewModalOpen(true);
  }

  // 모달 "제출" → 별점 등록 + 구매확정
  async function finalizeConfirmAndReview() {
    if (!reviewTargetId) return;

    try {
      setSubmittingReview(true);
      setConfirmingId(reviewTargetId);

      // 1. 별점 보내기
      await submitRating(reviewTargetId, rating);

      // 2. 구매 확정(정산) 처리
      await confirmSettlement(reviewTargetId);

      // 3. 로컬 state 업데이트 (이제 이 거래는 완료 처리)
      setSettledMap((prev) => ({
        ...prev,
        [String(reviewTargetId)]: true,
      }));

      // 4. 종료 탭으로 전환
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

  // 리스트 렌더러
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
              // 이미 확정된 건 UI에서 바로 '거래 완료'로 보이게
              statusText: settled ? "거래 완료" : it.statusText,
            }}
            canConfirm={canShowConfirmButton(it)}
            confirming={confirmingId === orderId}
            onConfirmClick={handleRequestConfirm}
            onClick={(clickedId) => {
              console.log("row clicked:", clickedId);
              // 상세 페이지 이동 필요 시 여기서 nav(`/auctions/${clickedId}`)
            }}
          />
        );
      })}
    </ul>
  );

  // 빈 상태 UI (+ 쇼핑 유도 CTA)
  const renderEmptyState = () => (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <p className="text-sm text-neutral-500">구매 내역이 없습니다.</p>
      <button
        type="button"
        onClick={() => {
          // 사용자가 물건 보러 갈 수 있는 경로로 수정
          // 예: 전체 경매 목록 / 카테고리 페이지 등
          window.location.href = "/auctions";
        }}
        className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-purple-500/50 hover:brightness-110 focus:ring-2 focus:ring-purple-400 focus:outline-none"
      >
        지금 구경하러 가기
      </button>
    </div>
  );

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>

      {/* 탭 (전체 / 진행중 / 종료) */}
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

      {/* 구매확정 / 별점 모달 */}
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
