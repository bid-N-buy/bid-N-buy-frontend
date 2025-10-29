// src/features/mypage/hooks/useSales.ts
import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem } from "../types/trade";
import { fromSale } from "../utils/tradeMappers";

type Options = {
  page?: number;
  size?: number;
  sort?: "end" | "start";
};

export function useSales(opts: Options = {}) {
  const { page = 0, size = 20, sort = "end" } = opts;

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

        // 응답 형태 방어:
        // - 백엔드가 배열로 주는 경우: res
        // - { items: [], total: n } 형식으로 주는 경우: res.items
        const rawItems = Array.isArray(res) ? res : (res.items ?? []);
        const mappedItems = rawItems.map(fromSale) as TradeItem[];

        if (!alive) return;

        setData(mappedItems);
        setTotal(
          typeof (res as any).total === "number"
            ? (res as any).total
            : mappedItems.length
        );
      } catch (e) {
        if (!alive) return;
        setError(e);
        setData([]);
        setTotal(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, size, sort]);

  // reload()는 필요하면 나중에 구현 가능. 일단 no-op으로 유지
  return { data, total, loading, error, reload: () => {} };
}
