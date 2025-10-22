// src/features/mypage/hooks/useMyTrades.ts
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type {
  TradeItem,
  PurchaseResponseItem,
  SaleResponseItem,
} from "../types/trade";
import { fromPurchase, fromSale } from "../types/trade";

/* ------------------ 내부 유틸 ------------------ */
const safeDate = (v?: string | number | null) =>
  v ? new Date(v).getTime() || 0 : 0;

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
      purchases: "/mypage/purchase",
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
