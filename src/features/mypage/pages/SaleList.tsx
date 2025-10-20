// src/features/mypage/pages/SaleList.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../hooks/useSales";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
// 상태+종료시간을 함께 판단하는 아이템 전용 헬퍼
import { isOngoing as isOngoingItem } from "../utils/tradeStatus";
import { MOCK_SALES } from "../mocks/tradeMocks"; // 경로 확인

export default function SaleList() {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const nav = useNavigate();

  const { data, loading, error } = useSales({
    page: 0,
    size: 20,
    sort: "end",
    useMock: true, // 서버 비었으면 훅에서 목업 채움
  });

  // 실데이터가 있으면 사용, 없으면 목업
  const base = useMemo(() => {
    return data && data.length > 0 ? data : MOCK_SALES;
  }, [data]);

  // 카운트 (상태+종료시간 모두 고려)
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter((d) =>
      isOngoingItem({ status: d.status, auctionEnd: d.auctionEnd })
    ).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base]);

  // 필터링
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

  // 에러이면서 데이터가 정말 비어 있는 특수 케이스(보통은 base가 목업으로 채워짐)
  if (error && base.length === 0) {
    return (
      <div className="p-4">
        <h2 className="mb-3 text-lg font-semibold">판매 내역</h2>
        {renderList(MOCK_SALES)}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-3 text-lg font-semibold">판매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
      />

      {loading ? (
        <p>불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p className="text-neutral-500">판매 내역이 없습니다.</p>
      ) : (
        renderList(filtered)
      )}
    </div>
  );
}
