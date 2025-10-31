import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../hooks/useSales";
import TradeRowCompact from "../components/items/TradeRowCompact";
import StatusTriFilter, {
  type TriFilterValue,
} from "../components/filters/StatusTriFilter";

// 진행/종료 + 정렬 util (결제 상태 반영 버전)
import { isOngoing, compareTradeItems } from "../utils/tradeStatus";

import type { AuctionItem } from "../../auction/types/auctions";

// 정규화 타입
type NormForFilter = {
  id: number;
  status: string;
  auctionEnd: string;

  // ⬇ 결제/정산/결과 필드
  paid?: boolean | null;
  paymentStatus?: string | null;
  settlementStatus?: string | null;
  payStatus?: string | null;
  depositStatus?: string | null;
  resultStatus?: string | null;

  original: AuctionItem | any;
};

// null 병합 유틸: 첫 번째 non-null 반환
const first = <T,>(...vals: (T | null | undefined)[]): T | null =>
  vals.find((v) => v != null) ?? null;

export default function SaleList() {
  const [filter, setFilter] = useState<TriFilterValue>("all");
  const nav = useNavigate();

  const { data, loading, error } = useSales({
    page: 0,
    size: 20,
    sort: "end",
  });

  const normalized: NormForFilter[] = useMemo(
    () =>
      (data ?? []).map((it: any) => {
        const id = (it.auctionId ?? it.id) as number;
        const status = (it.sellingStatus ?? it.status ?? "") as string;
        const auctionEnd = (it.endTime ?? it.auctionEnd ?? "") as string;

        const paid =
          typeof it.paid === "boolean"
            ? it.paid
            : it.isPaid === true
              ? true
              : it.paymentDone === true
                ? true
                : null;

        const paymentStatus = first(
          it.paymentStatus,
          it.payStatus,
          it.depositStatus
        );
        const settlementStatus = first(it.settlementStatus);
        const resultStatus = first(it.resultStatus, it.tradeResult);

        return {
          id,
          status,
          auctionEnd,
          paid,
          paymentStatus,
          settlementStatus,
          payStatus: it.payStatus ?? null,
          depositStatus: it.depositStatus ?? null,
          resultStatus,
          original: it,
        } as NormForFilter;
      }),
    [data]
  );

  const counts = useMemo(() => {
    const all = normalized.length;

    const ongoing = normalized.filter((d) =>
      isOngoing({
        status: d.status,
        auctionEnd: d.auctionEnd,
        paid: d.paid,
        paymentStatus: d.paymentStatus,
        settlementStatus: d.settlementStatus,
        payStatus: d.payStatus,
        depositStatus: d.depositStatus,
        resultStatus: d.resultStatus,
      } as any)
    ).length;

    const ended = all - ongoing;
    return { all, ongoing, ended };
  }, [normalized]);

  const filtered = useMemo(() => {
    if (filter === "all") return normalized;

    if (filter === "ongoing") {
      return normalized.filter((d) =>
        isOngoing({
          status: d.status,
          auctionEnd: d.auctionEnd,
          paid: d.paid,
          paymentStatus: d.paymentStatus,
          settlementStatus: d.settlementStatus,
          payStatus: d.payStatus,
          depositStatus: d.depositStatus,
          resultStatus: d.resultStatus,
        } as any)
      );
    }

    return normalized.filter(
      (d) =>
        !isOngoing({
          status: d.status,
          auctionEnd: d.auctionEnd,
          paid: d.paid,
          paymentStatus: d.paymentStatus,
          settlementStatus: d.settlementStatus,
          payStatus: d.payStatus,
          depositStatus: d.depositStatus,
          resultStatus: d.resultStatus,
        } as any)
    );
  }, [normalized, filter]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        compareTradeItems(
          {
            status: a.status,
            auctionEnd: a.auctionEnd,
            paid: a.paid,
            paymentStatus: a.paymentStatus,
            settlementStatus: a.settlementStatus,
            payStatus: a.payStatus,
            depositStatus: a.depositStatus,
            resultStatus: a.resultStatus,
          } as any,
          {
            status: b.status,
            auctionEnd: b.auctionEnd,
            paid: b.paid,
            paymentStatus: b.paymentStatus,
            settlementStatus: b.settlementStatus,
            payStatus: b.payStatus,
            depositStatus: b.depositStatus,
            resultStatus: b.resultStatus,
          } as any
        )
      ),
    [filtered]
  );

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

  const renderEmptyState = () => (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <p className="text-sm text-gray-600">판매 내역이 없습니다.</p>
      <button
        type="button"
        onClick={() => nav("/auctions/new")}
        className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-purple-500/50 hover:brightness-110 focus:ring-2 focus:ring-purple-400 focus:outline-none"
      >
        경매 등록하기
      </button>
    </div>
  );

  if (error && !loading && normalized.length === 0) {
    return (
      <div className="min-h-[800px] p-4">
        <h2 className="mb-3 text-lg font-semibold">판매 내역</h2>
        <StatusTriFilter
          value={filter}
          onChange={setFilter}
          counts={{ all: 0, ongoing: 0, ended: 0 }}
          className="mb-3"
        />
        {renderEmptyState()}
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
        <p className="text-neutral-500">불러오는 중…</p>
      ) : sorted.length === 0 ? (
        renderEmptyState()
      ) : (
        renderList(sorted)
      )}
    </div>
  );
}
