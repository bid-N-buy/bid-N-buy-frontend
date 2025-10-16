// src/features/mypage/hooks/useSales.ts
import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { fromSale } from "../lib/normalizers";
import type { TradeItem } from "../types/trade";

type Options = {
  page?: number;
  size?: number;
  status?: string;
  sort?: "end" | "start";
};
export function useSales(opts: Options = {}) {
  const { page = 0, size = 20, status, sort = "end" } = opts;
  const [data, setData] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await api.get("/mypage/sales", {
          params: { page, size, status, sort },
        });
        const items = (res.items ?? res ?? []).map(fromSale) as TradeItem[];
        if (!alive) return;
        setData(items);
        setTotal(res.total ?? items.length);
      } catch (e) {
        if (!alive) return;
        setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, size, status, sort]);

  return { data, total, loading, error };
}
