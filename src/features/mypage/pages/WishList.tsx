// src/features/mypage/pages/WishList.tsx
import React, { useMemo, useState, useCallback } from "react";
import { useWishlist } from "../hooks/useWishlist";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";

import { isOngoing as isOngoingItem } from "../utils/tradeStatus";
import type { TradeItem } from "../types/trade";

const WishList: React.FC = () => {
  const [filter, setFilter] = useState<TriFilterValue>("all");

  // 서버에서만 가져온 찜 목록
  const { data, loading, error } = useWishlist({
    page: 0,
    size: 20,
    sort: "end",
  });

  // 항상 배열 형태로 사용
  const base: TradeItem[] = data ?? [];

  // 진행중 여부 판정 함수 메모
  const isOngoingForItem = useCallback((x: TradeItem) => isOngoingItem(x), []);

  // 전체/진행중/종료 카운트
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter(isOngoingForItem).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base, isOngoingForItem]);

  // 현재 탭(필터)에 맞는 목록
  const filtered = useMemo(() => {
    if (filter === "all") return base;
    if (filter === "ongoing") return base.filter(isOngoingForItem);
    // filter === "ended"
    return base.filter((x) => !isOngoingForItem(x));
  }, [base, filter, isOngoingForItem]);

  // 찜 토글 핸들러 (하트)
  const handleToggleLike = (auctionId: number, nextLiked: boolean) => {
    console.log("toggle like", auctionId, nextLiked);
    // TODO:
    //  nextLiked === false -> DELETE /wishs/:auctionId
    //  nextLiked === true  -> POST /wishs
    //  성공 시 refetch or optimistic update
  };

  // 완전히 비어 있는지?
  const isTrulyEmpty = !loading && filtered.length === 0;

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

          {/* 👉 여기 CTA 버튼 추가하고 싶으면 이 안에 넣으면 돼
              예: 관심 상품 둘러보기 */}
          {/* <button
            type="button"
            onClick={() => (window.location.href = "/auctions")}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-purple-500/50 hover:brightness-110 focus:ring-2 focus:ring-purple-400 focus:outline-none"
          >
            지금 인기 상품 보기
          </button> */}
        </div>
      ) : (
        // 실제 목록
        <ul role="list" aria-label="찜한 상품 목록">
          {filtered.map((it, idx) => (
            <TradeRowCompact
              key={it.id || idx}
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
