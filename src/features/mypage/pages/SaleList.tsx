// src/features/mypage/pages/SaleList.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../hooks/useSales";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";
import { MOCK_SALES } from "../mocks/tradeMocks";

// ✅ 공통 유틸: 판매탭은 BEFORE(= "시작전")를 진행으로 취급
import { isOngoing, compareTradeItems } from "../utils/tradeStatus";

// ✅ API 타입 (경로는 프로젝트 구조에 맞춰 조정)
import type { AuctionItem } from "../../auction/types/auctions";

/** 유틸용으로 최소 필드만 노멀라이즈한 타입 */
type NormForFilter = {
  id: number; // auctionId or id
  status: string; // sellingStatus or status
  auctionEnd: string; // endTime or auctionEnd
  original: AuctionItem | any; // 원본 아이템(렌더링용)
};

export default function SaleList() {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const nav = useNavigate();

  // ✅ useSales는 AuctionItem[]을 반환한다고 가정 (목업도 같은 스키마)
  const { data, loading, error } = useSales({
    page: 0,
    size: 20,
    sort: "end",
    useMock: true,
  });

  // ✅ 실데이터 우선, 없으면 목업
  const baseRaw: (AuctionItem | any)[] = useMemo(
    () => (data && data.length > 0 ? data : (MOCK_SALES as any[])),
    [data]
  );

  // ✅ 유틸(isOngoing/compareTradeItems)에서 쓰는 키로만 노멀라이즈
  const normalized: NormForFilter[] = useMemo(
    () =>
      (baseRaw ?? []).map((it) => ({
        id: (it?.auctionId ?? it?.id) as number,
        status: (it?.sellingStatus ?? it?.status) as string,
        auctionEnd: (it?.endTime ?? it?.auctionEnd) as string,
        original: it,
      })),
    [baseRaw]
  );

  // ✅ 카운트 — 판매탭: BEFORE(시작전)도 진행으로 취급
  const counts = useMemo(() => {
    const all = normalized.length;
    const ongoing = normalized.filter((d) =>
      isOngoing({ status: d.status, auctionEnd: d.auctionEnd })
    ).length;
    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [normalized]);

  // ✅ 필터 적용
  const filtered = useMemo(() => {
    if (filter === "all") return normalized;
    if (filter === "ongoing") {
      return normalized.filter((d) =>
        isOngoing({ status: d.status, auctionEnd: d.auctionEnd })
      );
    }
    // ended
    return normalized.filter(
      (d) => !isOngoing({ status: d.status, auctionEnd: d.auctionEnd })
    );
  }, [normalized, filter]);

  // ✅ 정렬: 기존 compareTradeItems 재사용 (status/auctionEnd 기반)
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareTradeItems(a as any, b as any)),
    [filtered]
  );

  // ✅ 렌더: 원본 아이템을 그대로 전달 (TradeRowCompact가 하이브리드 대응)
  const renderList = (list: NormForFilter[]) => (
    <ul className="min-h-[800px]">
      {list.map(({ id, original }) => (
        <TradeRowCompact
          key={id}
          item={original}
          onClick={(clickedId) => nav(`/auctions/${clickedId}`)}
        />
      ))}
    </ul>
  );

  // 에러이면서 데이터가 정말 비어 있는 특수 케이스
  if (error && normalized.length === 0) {
    return (
      <div className="min-h-[800px] p-4">
        <h2 className="mb-3 text-lg font-semibold">판매 내역</h2>
        {renderList(
          (MOCK_SALES as any[]).map((it) => ({
            id: it.auctionId ?? it.id,
            status: it.sellingStatus ?? it.status,
            auctionEnd: it.endTime ?? it.auctionEnd,
            original: it,
          }))
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[800px] p-4">
      <h2 className="text-lg font-semibold">판매 내역</h2>

      <StatusTriFilter
        value={filter}
        onChange={setFilter}
        counts={counts}
        className="mb-3"
      />

      {loading ? (
        <p>불러오는 중…</p>
      ) : sorted.length === 0 ? (
        <p className="text-neutral-500">판매 내역이 없습니다.</p>
      ) : (
        renderList(sorted)
      )}
    </div>
  );
}
