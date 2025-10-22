// src/features/trade/pages/TradeHistoryPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";

// ✅ 공통 타입/유틸을 한 군데에서만 import해서 중복 제거
//    (경로는 너가 만든 공통 모듈 경로로 맞춰줘)
//    예: "../../mypage/types/trade" 에 우리가 합친 유틸이 있다고 가정
import type { TradeItem, TradeStatus } from "../../mypage/types/trade";
import {
  // 공통 유틸들 (앞서 내가 만들어 준 파일 기준)
  toStatus as toStdStatus,
  STATUS_LABEL,
  compareTradeItems,
} from "../../mypage/types/trade";

/* =========================
 *        Utils (local)
 * ========================= */

// 날짜 포맷
const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mi = `${d.getMinutes()}`.padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd} ${hh}:${mi}`;
};

const currency = (n?: number | null) =>
  typeof n === "number" ? `${n.toLocaleString()}원` : "";

// ✅ 배지 색상은 화면 톤에 맞춰 이 파일에서만 유지
const STATUS_BADGE: Record<TradeStatus, string> = {
  BEFORE: "border-neutral-200 bg-neutral-50 text-neutral-700",
  SALE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-neutral-200 bg-neutral-50 text-neutral-700",
  FINISH: "border-neutral-200 bg-neutral-50 text-neutral-500",
};

/* =========================
 *        Types
 * ========================= */
type RawTrade = {
  id?: number | string;
  auctionId?: number | string;
  title?: string;
  itemName?: string;
  status?: string;
  createdAt?: string;
  endAt?: string; // ✅ 백엔드가 endAt을 주면 얘를 우선 사용
  thumbnailUrl?: string;
  mainImageUrl?: string;
  image?: string;
  price?: number;
  currentPrice?: number;
  finalPrice?: number;
};

/** 서버 → 표준 모델 매핑 */
const fromRaw = (r: RawTrade): TradeItem => {
  const id = String(r.id ?? r.auctionId ?? "");
  const price =
    Number(r.price ?? r.currentPrice ?? r.finalPrice ?? 0) || undefined;

  // ✅ 상태는 공통 유틸로 정규화 (여기서 별도 로직 만들지 않음)
  const status = toStdStatus(r.status);

  // ✅ 종료 시각: endAt 우선, 없으면 createdAt(임시) — 실제 스키마에 맞춰 바꿔줘
  const auctionEnd = r.endAt ?? r.createdAt;

  return {
    id,
    title: r.title ?? r.itemName ?? "제목 없음",
    thumbUrl: r.thumbnailUrl ?? r.mainImageUrl ?? r.image ?? null,
    price,
    status,
    statusText: STATUS_LABEL[status],
    auctionStart: undefined,
    auctionEnd,
  };
};

/* =========================
 *        API
 * ========================= */
// type Summary = { completedSalesCount: number; activeSalesCount: number };

async function fetchSummary(): Promise<Summary> {
  const { data } = await api.get<Summary>("/me/trades/summary");
  return data;
}
async function fetchTrades(type: "BUY" | "SELL"): Promise<RawTrade[]> {
  const { data } = await api.get<RawTrade[]>("/me/trades", {
    params: { type },
  });
  return data;
}

/* =========================
 *      Skeleton & Row
 * ========================= */
const RowSkeleton: React.FC = () => (
  <li className="flex animate-pulse gap-3 py-4">
    <div className="h-14 w-14 shrink-0 rounded bg-neutral-200" />
    <div className="min-w-0 flex-1">
      <div className="mb-2 h-4 w-2/3 rounded bg-neutral-200" />
      <div className="h-3 w-1/3 rounded bg-neutral-200" />
    </div>
    <div className="w-28 shrink-0 text-right">
      <div className="mb-2 ml-auto h-4 w-16 rounded bg-neutral-200" />
      <div className="ml-auto h-3 w-20 rounded bg-neutral-200" />
    </div>
  </li>
);

const TradeRow: React.FC<{
  item: TradeItem;
  onClick?: (id: string) => void;
}> = ({ item, onClick }) => {
  return (
    <li
      className="flex cursor-pointer gap-3 py-4"
      onClick={() => onClick?.(item.id)}
    >
      {/* 썸네일 */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-neutral-100 ring-1 ring-neutral-200">
        {item.thumbUrl ? (
          <img
            src={item.thumbUrl}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {/* 본문 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-5 text-neutral-900">
          {item.title}
        </p>
        <p className="mt-1 text-[12px] text-neutral-500">
          {currency(item.price)}
        </p>
      </div>

      {/* 우측 메타 */}
      <div className="w-28 shrink-0 text-right">
        <span
          className={[
            "inline-block rounded border px-2 py-0.5 text-[11px]",
            STATUS_BADGE[item.status],
          ].join(" ")}
        >
          {item.statusText ?? STATUS_LABEL[item.status]}
        </span>
        <div className="mt-2 text-[12px] text-neutral-500">
          {formatDate(item.auctionEnd)}
        </div>
      </div>
    </li>
  );
};

/* =========================
 *        Section
 * ========================= */
const Section: React.FC<{
  title: string;
  items: TradeItem[] | null;
  loading: boolean;
  error?: string | null;
  emptyText?: string;
  onRowClick?: (id: string) => void;
}> = ({
  title,
  items,
  loading,
  error,
  emptyText = "내역이 없습니다.",
  onRowClick,
}) => {
  // ✅ 로딩 끝나면 공통 정렬(compareTradeItems) 적용
  const sorted = useMemo(
    () => (!loading && items ? [...items].sort(compareTradeItems) : items),
    [items, loading]
  );

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

        {!loading && !error && sorted && sorted.length === 0 && (
          <li className="py-10 text-center text-sm text-neutral-500">
            {emptyText}
          </li>
        )}

        {!loading &&
          !error &&
          sorted &&
          sorted.map((it) => (
            <TradeRow key={it.id} item={it} onClick={onRowClick} />
          ))}
      </ul>
    </section>
  );
};

/* =========================
 *         Summary
 * ========================= */
type Summary = { completedSalesCount: number; activeSalesCount: number };

const SummaryBar: React.FC<{ summary: Summary | null; loading: boolean }> = ({
  summary,
  loading,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {/* 판매 완료된 거래 */}
      <div className="flex items-center justify-between">
        <div className="text-[20px] font-semibold text-neutral-900 sm:text-[22px]">
          <span className="text-neutral-700">판매 완료된 거래 </span>
          <span className="text-neutral-900">
            {loading ? "…" : (summary?.completedSalesCount ?? 0)}
          </span>
          <span className="text-neutral-700"> 건</span>
        </div>
        <Link
          to="/me/sales?status=completed"
          className="text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-700"
        >
          판매완료 보러가기
        </Link>
      </div>

      {/* 판매 물품(진행 중) */}
      <div className="flex items-center justify-between">
        <div className="text-[20px] font-semibold text-neutral-900 sm:text-[22px]">
          <span className="text-neutral-700">판매 물품 </span>
          <span className="text-neutral-900">
            {loading ? "…" : (summary?.activeSalesCount ?? 0)}
          </span>
          <span className="text-neutral-700"> 개</span>
        </div>
        <Link
          to="/me/sales?status=active"
          className="text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-700"
        >
          판매물품 보러가기
        </Link>
      </div>
    </div>
  );
};

/* =========================
 *          Page
 * ========================= */
const TradeHistoryPage: React.FC = () => {
  const nav = useNavigate();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [sumLoading, setSumLoading] = useState(true);
  const [sumError, setSumError] = useState<string | null>(null);

  const [buyItems, setBuyItems] = useState<TradeItem[] | null>(null);
  const [buyLoading, setBuyLoading] = useState(true);
  const [buyError, setBuyError] = useState<string | null>(null);

  const [sellItems, setSellItems] = useState<TradeItem[] | null>(null);
  const [sellLoading, setSellLoading] = useState(true);
  const [sellError, setSellError] = useState<string | null>(null);

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
        if (alive) setBuyItems((list ?? []).map(fromRaw));
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
        if (alive) setSellItems((list ?? []).map(fromRaw));
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

  const containerClass = useMemo(
    () => "mx-auto w-full max-w-[860px] px-4 sm:px-6 md:px-8",
    []
  );

  return (
    <main className={containerClass}>
      <header className="pt-6 pb-4">
        <h1 className="text-[22px] font-semibold text-neutral-900">
          내 거래 내역
        </h1>
      </header>

      <SummaryBar summary={summary} loading={sumLoading} />
      <hr className="mt-6 border-neutral-200" />

      <Section
        title="구매 내역"
        items={buyItems}
        loading={buyLoading}
        error={sumError ? sumError : buyError}
        emptyText="구매한 내역이 없어요."
        onRowClick={(id) => nav(`/auctions/${id}`)}
      />
      <Section
        title="판매 내역"
        items={sellItems}
        loading={sellLoading}
        error={sellError}
        emptyText="판매한 내역이 없어요."
        onRowClick={(id) => nav(`/auctions/${id}`)}
      />

      <div className="h-16" />
    </main>
  );
};

export default TradeHistoryPage;
