// src/features/mypage/hooks/useSales.ts
import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem } from "../types/trade";
import { fromSale } from "../utils/tradeMappers";
import { MOCK_SALES } from "../mocks/tradeMocks";

type Options = {
  page?: number;
  size?: number;
  sort?: "end" | "start";
  useMock?: boolean;
};

export function useSales(opts: Options = {}) {
  const {
    page = 0,
    size = 20,
    sort = "end",
    useMock = import.meta.env.DEV,
  } = opts;

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
          params: { page, size, sort },
        });
        const items = (res.items ?? res ?? []).map(fromSale) as TradeItem[];

        if (!alive) return;

        if (useMock && items.length === 0) {
          setData(MOCK_SALES);
          setTotal(MOCK_SALES.length);
        } else {
          setData(items);
          setTotal(res.total ?? items.length);
        }
      } catch (e) {
        if (!alive) return;
        setError(e);
        if (useMock) {
          setData(MOCK_SALES);
          setTotal(MOCK_SALES.length);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, size, sort, useMock]);

  return { data, total, loading, error, reload: () => {} };
}
