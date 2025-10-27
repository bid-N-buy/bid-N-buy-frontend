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

  // 서버 + fallback(mock)에서 정규화된 TradeItem[]을 주는 훅
  const { data, loading, error } = useWishlist({
    page: 0,
    size: 20,
    useMock: true,
  });

  // data 없을 경우에도 항상 배열로
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

  // 찜 토글 핸들러 (하트 눌렀을 때)
  const handleToggleLike = (auctionId: number, nextLiked: boolean) => {
    console.log("toggle like", auctionId, nextLiked);
    // TODO:
    // - nextLiked === false -> 찜 해제 API (DELETE /wishs/:auctionId 등)
    // - nextLiked === true  -> 찜 추가 API (POST /wishs 등)
    // - 성공하면 목록 다시 불러오거나, 낙관적 업데이트로 base 상태 갱신
  };

  // ======================
  // 렌더링 분기
  // ======================

  // 완전하게 아무 데이터가 없을 때(목록도 비었고 로딩도 아님)
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

      {/* 에러 메시지 (데이터까지 비었을 때만 크게 노출) */}
      {error && base.length === 0 && (
        <p className="mb-3 text-sm text-red-600">
          찜 목록을 불러오지 못했어요.
        </p>
      )}

      {/* 로딩 중인데 아직 아무 데이터도 없는 케이스 */}
      {loading && base.length === 0 ? (
        <p className="text-sm text-neutral-500">불러오는 중…</p>
      ) : isTrulyEmpty ? (
        // 데이터는 다 받아왔는데 현재 필터 결과가 0개인 경우
        <p className="text-sm text-neutral-500">찜한 항목이 없습니다.</p>
      ) : (
        // 실제 목록
        <ul role="list" aria-label="찜한 상품 목록">
          {filtered.map((it, idx) => (
            <TradeRowCompact
              key={it.id || idx} // 안전빵
              item={it}
              wishStyle={true} // 오른쪽에 하트 + 현재가 레이아웃
              onToggleLike={handleToggleLike}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default WishList;
