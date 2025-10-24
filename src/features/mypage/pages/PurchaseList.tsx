// src/features/mypage/pages/PurchasesPage.tsx
import React, { useMemo, useState } from "react";
import { usePurchases } from "../hooks/usePurchases";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import { MOCK_PURCHASES } from "../mocks/tradeMocks";
import type { TradeItem } from "../types/trade";

const toMs = (iso?: string) => (iso ? Date.parse(iso) : 0);
const isPast = (iso?: string) => {
  const t = toMs(iso);
  return Number.isFinite(t) && t <= Date.now();
};

/** 진행 여부:
 * - statusText 또는 status 기준으로 "진행 중" 상태인 경우
 * - 종료 시간이 지나지 않았을 때만 진행 중으로 간주
 */
function isOngoing(item: TradeItem) {
  const txt = (item.statusText ?? item.status ?? "").toString().trim();
  const u = txt.toUpperCase();
  return (
    (u.includes("진행") || u === "SALE" || u === "PROGRESS") &&
    !isPast(item.auctionEnd)
  );
}

/** 정렬: 진행군 → 종료군,
 *  진행군 내 종료 임박 우선,
 *  종료군 내 최근 종료 우선
 */
function compareItems(a: TradeItem, b: TradeItem) {
  const ao = isOngoing(a);
  const bo = isOngoing(b);
  if (ao && !bo) return -1;
  if (!ao && bo) return 1;
  if (ao && bo) return toMs(a.auctionEnd) - toMs(b.auctionEnd);
  return toMs(b.auctionEnd) - toMs(a.auctionEnd);
}

export default function PurchasesPage() {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const { data, loading, error } = usePurchases({
    page: 0,
    size: 20,
    sort: "end",
    useMock: true,
  });

  // 실데이터 없을 시 목업 사용
  const base: TradeItem[] = useMemo(
    () => (data && data.length > 0 ? data : (MOCK_PURCHASES as TradeItem[])),
    [data]
  );

  const counts = useMemo(() => {
    const all = base.length;
    const ongoing = base.filter(isOngoing).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [base]);

  const filtered = useMemo(() => {
    if (filter === "all") return base;
    if (filter === "ongoing") return base.filter(isOngoing);
    return base.filter((d) => !isOngoing(d));
  }, [base, filter]);

  const sorted = useMemo(() => [...filtered].sort(compareItems), [filtered]);

  const renderList = (list: TradeItem[]) => (
    <ul>
      {list.map((it) => (
        <TradeRowCompact key={it.id} item={it} />
      ))}
    </ul>
  );

  if (error && base.length === 0) {
    return (
      <div className="min-h-[800px] p-4">
        <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>
        {renderList(MOCK_PURCHASES as TradeItem[])}
      </div>
    );
  }

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="mb-3 text-lg font-semibold">구매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
      />

      {loading ? (
        <p>불러오는 중…</p>
      ) : sorted.length === 0 ? (
        <p className="text-neutral-500">구매 내역이 없습니다.</p>
      ) : (
        renderList(sorted)
      )}
    </div>
  );
}
