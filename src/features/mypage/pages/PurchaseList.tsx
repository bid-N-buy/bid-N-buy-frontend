// src/features/mypage/pages/PurchasesPage.tsx

import React, { useMemo, useState } from "react";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import { MOCK_PURCHASES } from "../mocks/tradeMocks";
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
 * - settledMap에서 이미 확정(true)이면 무조건 '진행중 아님'
 * - 그 외 기존 statusText / 시간 기준으로 판단
 * ========================================================= */
function isOngoing(
  item: TradeItem,
  settledMap: Record<string, boolean>
): boolean {
  const orderId = (item as any).orderId ?? item.id;
  if (settledMap[String(orderId)]) {
    // 내가 방금 구매확정 처리한 거래 => 더 이상 진행중으로 취급하지 않음
    return false;
  }

  const rawStatus =
    (item as any)?.statusText ??
    (item as any)?.status ??
    (item as any)?.state ??
    "";

  const txt = String(rawStatus).toUpperCase();

  // 종료/완료/취소 느낌 나는 단어 있으면 진행 아님
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

  // 마감시간(auctionEnd 등)이 이미 지났으면 진행 아님
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

  // 위에서 걸러지지 않으면 아직 진행중으로 본다
  return true;
}

/* =========================================================
 * 페이지
 * ========================================================= */
const PurchasesPage: React.FC = () => {
  // 탭 상태: "all" | "ongoing" | "ended"
  const [filter, setFilter] = useState<TriFilterValue>("all");

  // 어떤 orderId를 지금 처리중인지 (버튼 로딩)
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

  // 구매확정(정산 완료)된 orderId들을 로컬에 저장
  // { [orderId: string]: true }
  const [settledMap, setSettledMap] = useState<Record<string, boolean>>({});

  // 서버에서 구매내역
  const { data, loading, error } = usePurchases({
    page: 0,
    size: 20,
    sort: "end",
    useMock: true,
  });

  // 서버 데이터 없으면 목업
  const base: TradeItem[] = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) {
      return data as TradeItem[];
    }
    return MOCK_PURCHASES as TradeItem[];
  }, [data]);

  /* ---------------------------------------------------------
   * 탭 카운트
   * --------------------------------------------------------- */
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter((it) => isOngoing(it, settledMap)).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base, settledMap]);

  /* ---------------------------------------------------------
   * 탭 필터링
   * --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
   * 정렬 (진행중 먼저, 그다음 종료 / 종료끼리는 최근 마감일 우선)
   * --------------------------------------------------------- */
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

      // 같은 그룹이면 종료/마감 시간이 더 최근인 것 우선
      return getEndMs(b) - getEndMs(a);
    });
  }, [filtered, settledMap]);

  /* ---------------------------------------------------------
   * 구매 확정 버튼 노출 여부
   * --------------------------------------------------------- */
  function canShowConfirmButton(item: TradeItem): boolean {
    const orderId = (item as any).orderId ?? item.id;
    const localDone = settledMap[String(orderId)];
    const serverDone = (item as any).settled === true; // 혹시 서버에서 내려줄 수도 있으니까

    // 이미 확정된 건 버튼 숨김
    if (localDone || serverDone) return false;

    // 아직 진행중으로 보이는 애한테도 우리는 버튼을 보여주고 있음.
    // (정산 전 단계/정산중 단계 등도 유저가 눌러서 완료 가능하도록)
    return true;
  }

  /* ---------------------------------------------------------
   * "구매 확정" 버튼을 눌렀을 때 → 모달 열기
   * --------------------------------------------------------- */
  function handleRequestConfirm(orderId: number | string) {
    setReviewTargetId(orderId);
    setRating(10); // 기본값
    setReviewModalOpen(true);
  }

  /* ---------------------------------------------------------
   * 모달 "제출" → 별점 등록 + 정산 확정
   * --------------------------------------------------------- */
  async function finalizeConfirmAndReview() {
    if (!reviewTargetId) return;

    try {
      setSubmittingReview(true);
      setConfirmingId(reviewTargetId);

      // 1. 별점 등록
      const ratingMsg = await submitRating(reviewTargetId, rating);
      console.log("[별점 등록 성공]", ratingMsg);

      // 2. 구매 확정(정산)
      const settleMsg = await confirmSettlement(reviewTargetId);
      console.log("[구매 확정 성공]", settleMsg);

      // 3. 로컬에 이 orderId는 완료됨이라고 표기
      setSettledMap((prev) => ({
        ...prev,
        [String(reviewTargetId)]: true,
      }));

      // 4. 종료 탭으로 전환해서 곧바로 '완료 목록'을 보여줌
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

  /* ---------------------------------------------------------
   * 리스트 렌더러
   * - 확정된 애는 statusText를 강제로 '거래 완료'로 바꿔서 넘겨주기
   *   (UI에 바로 반영되도록)
   * --------------------------------------------------------- */
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
              // 이미 확정된 아이템이라면 라벨을 "거래 완료"로 강제 노출
              statusText: settled ? "거래 완료" : it.statusText,
            }}
            canConfirm={canShowConfirmButton(it)}
            confirming={confirmingId === orderId}
            onConfirmClick={handleRequestConfirm}
            onClick={(clickedId) => {
              console.log("row clicked:", clickedId);
              // 상세 페이지로 이동하고 싶으면 여기서 nav(`/auctions/${clickedId}`) 등
            }}
          />
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>

      {/* 필터 탭 (전체 / 진행중 / 종료) */}
      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
      />

      {loading ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : error && sorted.length === 0 ? (
        <div className="text-sm text-red-500">
          구매 내역을 불러오지 못했습니다.
          <div className="mt-4 text-black">
            {renderList(MOCK_PURCHASES as TradeItem[])}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">구매 내역이 없습니다.</p>
      ) : (
        renderList(sorted)
      )}

      {/* ⭐ 구매확정 / 별점 모달 */}
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
