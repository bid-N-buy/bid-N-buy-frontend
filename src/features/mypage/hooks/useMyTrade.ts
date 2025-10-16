// src/features/mypage/hooks/useMyTrades.ts
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type {
  TradeItem,
  PurchaseResponseItem,
  SaleResponseItem,
} from "../types/trade";

/* ------------------ 유틸 ------------------ */
const STATUS_LABELS: Record<string, TradeItem["status"]> = {
  BIDDING: "입찰 중",
  WIN: "낙찰",
  CLOSED: "마감",
  PENDING: "대기",
  "입찰 중": "입찰 중",
  낙찰: "낙찰",
  마감: "마감",
  대기: "대기",
};

const toStatus = (s?: string): TradeItem["status"] => {
  if (!s) return "대기";
  const key = s.trim();
  const upper = key.toUpperCase();
  return STATUS_LABELS[upper] ?? STATUS_LABELS[key] ?? "대기";
};

const safeDate = (v?: string | number | null) =>
  v ? new Date(v).getTime() || 0 : 0;

/* ---------- 서버 응답 → 공통 모델 ---------- */
const fromPurchase = (r: PurchaseResponseItem): TradeItem => ({
  id: String(r.id),
  title: r.itemName,
  sellerName: r.seller ?? "", // 필요시 구매자/판매자 필드명 맞추세요
  thumbUrl: r.thumbnail ?? null,
  status: toStatus(r.status),
  auctionStart: r.startAt,
  auctionEnd: r.endAt,
});

const fromSale = (r: SaleResponseItem): TradeItem => ({
  id: String(r.id),
  title: r.title,
  sellerName: r.meAsSeller ?? "", // 자신(판매자) 표시용
  thumbUrl: r.image ?? null,
  status: toStatus(r.status),
  auctionStart: r.startAt,
  auctionEnd: r.endAt,
});

type UseMyTradesOptions = {
  /** 정렬 기준: 기본은 종료 시각 최신순 */
  sortBy?: "auctionEnd" | "auctionStart";
  /** 최초 마운트 1회만 자동 호출 (이후엔 reload로만 갱신) */
  once?: boolean;
  /** 엔드포인트 오버라이드 */
  endpoints?: {
    purchases?: string;
    sales?: string;
  };
};

export function useMyTrades(opts: UseMyTradesOptions = {}) {
  const {
    sortBy = "auctionEnd",
    once = false,
    endpoints = {
      purchases: "/mypage/purchases",
      sales: "/mypage/sales",
    },
  } = opts;

  const [purchases, setPurchases] = useState<TradeItem[]>([]);
  const [sales, setSales] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const didRunOnceRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sorter = useMemo(() => {
    const key = sortBy === "auctionEnd" ? "auctionEnd" : "auctionStart";
    return (a: TradeItem, b: TradeItem) => safeDate(b[key]) - safeDate(a[key]);
  }, [sortBy]);

  const fetchAll = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get<PurchaseResponseItem[]>(endpoints.purchases!),
        api.get<SaleResponseItem[]>(endpoints.sales!),
      ]);

      if (!mountedRef.current) return;

      const p = (pRes.data ?? []).map(fromPurchase).sort(sorter);
      const s = (sRes.data ?? []).map(fromSale).sort(sorter);

      setPurchases(p);
      setSales(s);
    } catch (e: any) {
      if (!mountedRef.current) return;
      const msg =
        e?.response?.data?.message || e?.message || "목록을 불러오지 못했어요.";
      setError(String(msg));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    // once=true면 최초 1회만 자동 호출
    if (once && didRunOnceRef.current) return;
    didRunOnceRef.current = true;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [once, sorter, endpoints.purchases, endpoints.sales]);

  return {
    purchases,
    sales,
    loading,
    error,
    reload: fetchAll,
  };
}

export default useMyTrades;
