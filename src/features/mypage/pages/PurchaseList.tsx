// src/features/mypage/pages/PurchasesPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
// 상태+시간을 모두 고려하는 헬퍼 (status 전용 함수와 이름 충돌 주의)
import { isOngoing as isOngoingItem } from "../utils/tradeStatus";
import { MOCK_PURCHASES } from "../mocks/tradeMocks"; // 경로 확인!

export default function PurchasesPage() {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const nav = useNavigate();

  const { data, loading, error } = usePurchases({
    page: 0,
    size: 20,
    sort: "end",
    useMock: true, // 훅 내부에서 실패/빈값 시 목업으로 채워줌
  });

  // 기본 데이터(실데이터가 비면 목업으로 대체)
  const base = useMemo(() => {
    if (data && data.length > 0) return data;
    // 훅에서 이미 목업으로 채워주더라도 방어적으로 한 번 더
    return MOCK_PURCHASES;
  }, [data]);

  // 카운트 (상태+종료시간 모두 반영)
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter((d) =>
      isOngoingItem({ status: d.status, auctionEnd: d.auctionEnd })
    ).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base]);

  // 필터 적용
  const filtered = useMemo(() => {
    if (filter === "all") return base;
    if (filter === "ongoing") {
      return base.filter((d) =>
        isOngoingItem({ status: d.status, auctionEnd: d.auctionEnd })
      );
    }
    return base.filter(
      (d) => !isOngoingItem({ status: d.status, auctionEnd: d.auctionEnd })
    );
  }, [base, filter]);

  const renderList = (list: typeof base) => (
    <ul>
      {list.map((it) => (
        <TradeRowCompact
          key={it.id}
          item={it}
          onClick={(id) => nav(`/auctions/${id}`)}
        />
      ))}
    </ul>
  );

  // 에러이면서 데이터도 완전 비었을 때
  if (error && base.length === 0) {
    return (
      <div className="p-4">
        <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>
        {renderList(MOCK_PURCHASES)}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
      />

      {loading ? (
        <p>불러오는 중…</p>
      ) : filtered.length === 0 ? (
        // 필터 결과가 비어도 UX 위해 스켈레톤/목업을 보여주고 싶다면 아래 주석을 교체
        // renderList(MOCK_PURCHASES)
        <p className="text-neutral-500">구매 내역이 없습니다.</p>
      ) : (
        renderList(filtered)
      )}
    </div>
  );
}
