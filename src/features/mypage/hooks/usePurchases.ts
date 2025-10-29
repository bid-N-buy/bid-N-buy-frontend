// src/features/mypage/hooks/usePurchases.ts
import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem } from "../types/trade";
import { fromPurchase } from "../utils/tradeMappers"; // 서버응답 -> TradeItem 변환

type Options = {
  page?: number;
  size?: number;
  status?: string;
  sort?: "end" | "start";
};

export function usePurchases(opts: Options = {}) {
  const { page = 0, size = 20, status, sort = "end" } = opts;

  const [data, setData] = useState<TradeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: res } = await api.get("/mypage/purchase", {
          params: { page, size, status, sort },
        });

        // 서버가 배열로 줄 수도 있고 { items: [], total: n } 로 줄 수도 있어서 방어
        const rawList: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

        const mapped: TradeItem[] = rawList.map(fromPurchase);

        if (!alive) return;

        setData(mapped);
        setTotal(typeof res?.total === "number" ? res.total : mapped.length);
      } catch (err) {
        if (!alive) return;
        setError(err);
        setData([]);
        setTotal(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, size, status, sort]);

  return {
    data,
    total,
    loading,
    error,
    reload: () => {
      // 필요하면 refetch 로직 넣을 자리
    },
  };
}
