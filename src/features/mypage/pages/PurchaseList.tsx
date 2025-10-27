// src/features/mypage/pages/PurchasesPage.tsx

import React, { useMemo, useState } from "react";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import { MOCK_PURCHASES } from "../mocks/tradeMocks";
import type { TradeItem } from "../types/trade";

// ✅ 공통 유틸 (이미 types/trade 쪽에 있는 애들 사용)
import {
  isOngoing as isOngoingStd,
  compareTradeItems as compareStd,
} from "../types/trade";

export default function PurchasesPage() {
  // 전체 / 진행중 / 종료 탭
  const [filter, setFilter] = useState<TriFilterValue>("all");

  // 구매 내역 가져오는 훅
  // useMock: true -> 서버 비어 있거나 오류나도 MOCK_PURCHASES로 fallback 시도
  const { data, loading, error } = usePurchases({
    page: 0,
    size: 20,
    sort: "end",
    useMock: true,
  });

  // 기본 데이터 소스:
  // - 실제 data가 있으면 data
  // - 없으면 MOCK_PURCHASES (추가 방어)
  const base: TradeItem[] = useMemo(
    () => (data && data.length > 0 ? data : (MOCK_PURCHASES as TradeItem[])),
    [data]
  );

  // 탭에 표시할 카운트 (전체/진행중/종료)
  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter(isOngoingStd).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base]);

  // 현재 필터 상태에 맞는 목록 추출
  const filtered = useMemo(() => {
    if (filter === "all") return base;
    if (filter === "ongoing") return base.filter(isOngoingStd);
    return base.filter((d) => !isOngoingStd(d));
  }, [base, filter]);

  // 정렬
  // compareStd 는 compareTradeItems (진행 우선 → 종료 뒤, 종료는 최근 종료 순 등)
  const sorted = useMemo(() => [...filtered].sort(compareStd), [filtered]);

  // 실제 렌더 함수
  const renderList = (list: TradeItem[]) => (
    <ul>
      {list.map((it) => (
        <TradeRowCompact key={it.id} item={it} />
      ))}
    </ul>
  );

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>

      {/* 진행중/종료 필터 탭 */}
      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
      />

      {loading ? (
        // 1. 로딩 중
        <p>불러오는 중…</p>
      ) : error && sorted.length === 0 ? (
        // 2. 에러 났는데 보여줄 데이터도 없음
        <div className="text-sm text-red-500">
          구매 내역을 불러오지 못했습니다.
          <div className="mt-4">
            {renderList(MOCK_PURCHASES as TradeItem[])}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        // 3. 정상 호출됐는데도 진짜로 내역 없음
        <p className="text-neutral-500">구매 내역이 없습니다.</p>
      ) : (
        // 4. 정상 목록 렌더
        renderList(sorted)
      )}
    </div>
  );
}
