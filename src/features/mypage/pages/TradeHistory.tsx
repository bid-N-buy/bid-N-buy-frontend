// src/features/trade/pages/TradeHistoryPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

/** -------------------- Axios Client -------------------- */
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080";

const client = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

/** -------------------- Types -------------------- */
type TradeStatus = "거래 중" | "입금 중" | "완료" | string;

export interface TradeItem {
  id: number | string;
  title: string;
  status: TradeStatus;
  createdAt: string; // ISO
  thumbnailUrl?: string | null;
  price?: number | null;
}

interface Summary {
  completedSalesCount: number;
  activeSalesCount: number;
}

/** -------------------- Utils -------------------- */
const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mi = `${d.getMinutes()}`.padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
};

const currency = (n?: number | null) =>
  typeof n === "number" ? n.toLocaleString() + "원" : "";

/** -------------------- API Calls -------------------- */
async function fetchSummary(): Promise<Summary> {
  const { data } = await client.get<Summary>("/me/trades/summary");
  return data;
}

async function fetchTrades(type: "BUY" | "SELL"): Promise<TradeItem[]> {
  const { data } = await client.get<TradeItem[]>("/me/trades", {
    params: { type },
  });
  return data;
}

/** -------------------- Skeleton Row -------------------- */
const RowSkeleton: React.FC = () => (
  <li className="flex gap-3 py-4 animate-pulse">
    <div className="h-14 w-14 rounded bg-neutral-200 shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="h-4 w-2/3 bg-neutral-200 rounded mb-2" />
      <div className="h-3 w-1/3 bg-neutral-200 rounded" />
    </div>
    <div className="text-right shrink-0 w-20">
      <div className="h-4 w-14 bg-neutral-200 rounded mb-2 ml-auto" />
      <div className="h-3 w-16 bg-neutral-200 rounded ml-auto" />
    </div>
  </li>
);

/** -------------------- Row -------------------- */
const TradeRow: React.FC<{ item: TradeItem }> = ({ item }) => {
  return (
    <li className="flex gap-3 py-4">
      {/* 썸네일 */}
      <div className="h-14 w-14 shrink-0 rounded bg-neutral-100 ring-1 ring-neutral-200 overflow-hidden">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-[15px] leading-5 text-neutral-900">
          {item.title}
        </p>
        <p className="mt-1 text-[12px] text-neutral-500">
          {currency(item.price)}
        </p>
      </div>

      {/* 우측 메타 */}
      <div className="text-right shrink-0 w-28">
        <span
          className={[
            "inline-block rounded px-2 py-0.5 text-[11px] border",
            item.status === "완료"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-neutral-200 bg-neutral-50 text-neutral-700",
          ].join(" ")}
        >
          {item.status}
        </span>
        <div className="mt-2 text-[12px] text-neutral-500">
          {formatDate(item.createdAt)}
        </div>
      </div>
    </li>
  );
};

/** -------------------- Section -------------------- */
const Section: React.FC<{
  title: string;
  items: TradeItem[] | null;
  loading: boolean;
  error?: string | null;
  emptyText?: string;
}> = ({ title, items, loading, error, emptyText = "내역이 없습니다." }) => {
  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold text-neutral-900">{title}</h2>
      </div>

      <ul className="mt-4 divide-y divide-neutral-200">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}

        {!loading && error && (
          <li className="py-8 text-center text-sm text-red-500">{error}</li>
        )}

        {!loading && !error && items && items.length === 0 && (
          <li className="py-10 text-center text-sm text-neutral-500">
            {emptyText}
          </li>
        )}

        {!loading &&
          !error &&
          items &&
          items.map((it) => <TradeRow key={it.id} item={it} />)}
      </ul>
    </section>
  );
};

/** -------------------- Summary -------------------- */
const SummaryBar: React.FC<{ summary: Summary | null; loading: boolean }> = ({
  summary,
  loading,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* 판매 완료된 거래 */}
      <div className="flex items-center justify-between">
        <div className="text-[20px] sm:text-[22px] font-semibold text-neutral-900">
          <span className="text-neutral-700">판매 완료된 거래 </span>
          <span className="text-neutral-900">
            {loading ? "…" : summary?.completedSalesCount ?? 0}
          </span>
          <span className="text-neutral-700"> 건</span>
        </div>
        <Link
          to="/me/sales?status=completed"
          className="text-[13px] text-neutral-500 hover:text-neutral-700 underline underline-offset-4"
        >
          판매완료 보러가기
        </Link>
      </div>

      {/* 판매 물품(진행 중) */}
      <div className="flex items-center justify-between">
        <div className="text-[20px] sm:text-[22px] font-semibold text-neutral-900">
          <span className="text-neutral-700">판매 물품 </span>
          <span className="text-neutral-900">
            {loading ? "…" : summary?.activeSalesCount ?? 0}
          </span>
          <span className="text-neutral-700"> 개</span>
        </div>
        <Link
          to="/me/sales?status=active"
          className="text-[13px] text-neutral-500 hover:text-neutral-700 underline underline-offset-4"
        >
          판매물품 보러가기
        </Link>
      </div>
    </div>
  );
};

/** -------------------- Page -------------------- */
const TradeHistoryPage: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sumLoading, setSumLoading] = useState(true);
  const [sumError, setSumError] = useState<string | null>(null);

  const [buyItems, setBuyItems] = useState<TradeItem[] | null>(null);
  const [buyLoading, setBuyLoading] = useState(true);
  const [buyError, setBuyError] = useState<string | null>(null);

  const [sellItems, setSellItems] = useState<TradeItem[] | null>(null);
  const [sellLoading, setSellLoading] = useState(true);
  const [sellError, setSellError] = useState<string | null>(null);

  // 최초 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setSumLoading(true);
        const s = await fetchSummary();
        if (alive) setSummary(s);
      } catch (e: any) {
        if (alive) setSumError(e?.message ?? "요약 정보를 불러오지 못했어요.");
      } finally {
        if (alive) setSumLoading(false);
      }
    })();

    (async () => {
      try {
        setBuyLoading(true);
        const list = await fetchTrades("BUY");
        if (alive) setBuyItems(list);
      } catch (e: any) {
        if (alive) setBuyError(e?.message ?? "구매 내역을 불러오지 못했어요.");
      } finally {
        if (alive) setBuyLoading(false);
      }
    })();

    (async () => {
      try {
        setSellLoading(true);
        const list = await fetchTrades("SELL");
        if (alive) setSellItems(list);
      } catch (e: any) {
        if (alive) setSellError(e?.message ?? "판매 내역을 불러오지 못했어요.");
      } finally {
        if (alive) setSellLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 상단 좌우 패딩 기준(컨테이너)
  const containerClass = useMemo(
    () =>
      "mx-auto w-full max-w-[860px] px-4 sm:px-6 md:px-8",
    []
  );

  return (
    <main className={containerClass}>
      {/* 상단 타이틀 + 요약 바 */}
      <header className="pt-6 pb-4">
        <h1 className="text-[22px] font-semibold text-neutral-900">
          내 거래 내역
        </h1>
      </header>

      <SummaryBar summary={summary} loading={sumLoading} />

      {/* 구분선 */}
      <hr className="mt-6 border-neutral-200" />

      {/* 구매/판매 리스트 */}
      <Section
        title="구매 내역"
        items={buyItems}
        loading={buyLoading}
        error={buyError}
        emptyText="구매한 내역이 없어요."
      />
      <Section
        title="판매 내역"
        items={sellItems}
        loading={sellLoading}
        error={sellError}
        emptyText="판매한 내역이 없어요."
      />

      {/* 페이지 하단 여백 */}
      <div className="h-16" />
    </main>
  );
};

export default TradeHistoryPage;
