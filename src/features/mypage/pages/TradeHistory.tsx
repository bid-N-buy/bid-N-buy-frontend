// src/features/trade/pages/TradeHistoryPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";

import type { TradeItem, TradeStatus } from "../../mypage/types/trade";
import {
  fromPurchase,
  fromSale,
  STATUS_LABEL,
} from "../../mypage/utils/tradeMappers";

import { compareTradeItems } from "../../mypage/utils/tradeStatus";
/* =========================
 *        Types
 * ========================= */

/**
 * /me/trades?type=BUY or SELL 에서 내려오는 원본
 * (실제 백엔드 응답 스키마 기준으로 맞춰줘도 돼.
 *  아래 필드들은 네가 보여준 코드 기준으로 유추한 값들이라서
 *  일부 백엔드 필드명이 다르면 거기에 맞게만 바꿔주면 돼.)
 */
type RawTrade = {
  id?: number | string;
  auctionId?: number | string;

  title?: string;
  itemName?: string;

  // 상태 관련
  status?: string; // 예: "진행중", "BEFORE", "결제 대기 중 (진행 중)" 등
  statusText?: string; // 혹시 서버에서 라벨 따로 주면

  // 시간 관련
  startAt?: string;
  startTime?: string;
  createdAt?: string; // 과거 코드에서 fallback으로 쓰던 값
  endAt?: string; // 마감 시간
  endTime?: string;

  // 이미지
  thumbnailUrl?: string;
  mainImageUrl?: string;
  image?: string;
  itemImageUrl?: string;

  // 금액
  price?: number;
  currentPrice?: number;
  finalPrice?: number;

  // 상대방 닉네임 관련(구매/판매에서 다르게 올 수 있음)
  sellerNickname?: string;
  buyerNickname?: string;
  winnerNickname?: string;
};

/**
 * 백엔드 응답에서 BUY / SELL을 불러오는 함수들
 */
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
 *    Raw -> ApiPurchase / ApiSale 변환
 * =========================
 *
 * 여기서 하는 일:
 * - /me/trades 응답(RawTrade)을 우리가 이미 갖고 있는
 *   fromPurchase / fromSale 에 맞는 형태로 재구성해준다.
 *
 * 주의: 아래 매핑은 네 백엔드 실제 필드 이름에 맞게 조정 가능.
 * 지금은 네가 보여준 코드 기준으로 reasonable하게 맵핑해둔 상태.
 */

// RawTrade -> ApiPurchase 호환 객체
function toApiPurchaseShape(r: RawTrade) {
  return {
    // id류
    auctionId: r.auctionId ?? r.id,
    id: r.id,

    // 타이틀류
    title: r.title ?? r.itemName,
    itemName: r.itemName,

    // 이미지류 (fromPurchase에서 itemImageUrl 등을 본다)
    itemImageUrl:
      r.itemImageUrl ?? r.thumbnailUrl ?? r.mainImageUrl ?? r.image ?? null,

    // 상태 정보
    status: r.status,
    statusText: r.statusText ?? r.status,

    // 시간 정보
    startAt: r.startAt ?? r.startTime,
    startTime: r.startTime ?? r.startAt,
    endAt: r.endAt ?? r.endTime ?? r.createdAt,
    endTime: r.endTime ?? r.endAt ?? r.createdAt,

    // 가격
    finalPrice: r.finalPrice ?? r.currentPrice ?? r.price ?? undefined,
    currentPrice: r.currentPrice,
    price: r.price,

    // 판매자(구매 내역에서 counterparty는 보통 판매자)
    sellerNickname: r.sellerNickname,
    seller: r.sellerNickname, // 혹시 fromPurchase 쪽에서 seller를 우선 보도록 했다면
  };
}

// RawTrade -> ApiSale 호환 객체
function toApiSaleShape(r: RawTrade) {
  return {
    // id류
    auctionId: r.auctionId ?? r.id,
    id: r.id,

    // 타이틀류
    title: r.title ?? r.itemName,
    itemName: r.itemName,

    // 이미지류 (fromSale에서 itemImageUrl 등을 본다)
    itemImageUrl:
      r.itemImageUrl ?? r.thumbnailUrl ?? r.mainImageUrl ?? r.image ?? null,

    // 상태 정보
    status: r.status,
    statusText: r.statusText ?? r.status,

    // 시간 정보
    startAt: r.startAt ?? r.startTime,
    startTime: r.startTime ?? r.startAt,
    endAt: r.endAt ?? r.endTime ?? r.createdAt,
    endTime: r.endTime ?? r.endAt ?? r.createdAt,

    // 금액
    finalPrice: r.finalPrice ?? r.currentPrice ?? r.price ?? undefined,
    currentPrice: r.currentPrice,
    price: r.price,

    // 구매자/낙찰자 정보 (판매 내역의 counterparty)
    buyerNickname: r.buyerNickname,
    winnerNickname: r.winnerNickname,
  };
}

/* =========================
 *   Summary / Skeleton / Row / Section
 * ========================= */

type Summary = { completedSalesCount: number; activeSalesCount: number };

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

// 상태 배지 색상
const STATUS_BADGE: Record<TradeStatus, string> = {
  BEFORE: "border-neutral-200 bg-neutral-50 text-neutral-700",
  SALE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-neutral-200 bg-neutral-50 text-neutral-700",
  FINISH: "border-neutral-200 bg-neutral-50 text-neutral-500",
  UNKNOWN: "border-neutral-200 bg-neutral-50 text-neutral-500",
};

// 뼈대
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

// 한 줄 렌더
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
            STATUS_BADGE[item.status] ?? STATUS_BADGE.UNKNOWN,
          ].join(" ")}
        >
          {item.statusText ?? STATUS_LABEL[item.status] ?? "상태 미정"}
        </span>
        <div className="mt-2 text-[12px] text-neutral-500">
          {formatDate(item.auctionEnd)}
        </div>
      </div>
    </li>
  );
};

// 섹션(구매 내역 / 판매 내역)
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
  // 로딩이 끝나면 진행중 우선 정렬(compareTradeItems)
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

// 상단 Summary 바
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

    // 요약
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

    // 구매 내역
    (async () => {
      try {
        setBuyLoading(true);
        const rawList = await fetchTrades("BUY");

        // RawTrade[] -> ApiPurchase 형식 -> fromPurchase -> TradeItem[]
        const normalizedPurchaseLike = rawList.map(toApiPurchaseShape);
        const finalItems = normalizedPurchaseLike.map(fromPurchase);

        if (alive) setBuyItems(finalItems);
      } catch (e: any) {
        if (alive) setBuyError(e?.message ?? "구매 내역을 불러오지 못했어요.");
      } finally {
        if (alive) setBuyLoading(false);
      }
    })();

    // 판매 내역
    (async () => {
      try {
        setSellLoading(true);
        const rawList = await fetchTrades("SELL");

        // RawTrade[] -> ApiSale 형식 -> fromSale -> TradeItem[]
        const normalizedSaleLike = rawList.map(toApiSaleShape);
        const finalItems = normalizedSaleLike.map(fromSale);

        if (alive) setSellItems(finalItems);
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
