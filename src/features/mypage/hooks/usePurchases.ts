// src/features/mypage/hooks/usePurchases.ts
import { useEffect, useRef, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem } from "../types/trade";
import { fromPurchase } from "../utils/tradeMappers";

type Options = {
  page?: number;
  size?: number;
  status?: string;
  sort?: "end" | "start"; // 서버가 지원하면 유지
};

export function usePurchases(opts: Options = {}) {
  const { page = 0, size = 20, status, sort = "end" } = opts;

  const [data, setData] = useState<TradeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // 외부에서 강제 리패치할 때 사용할 토글
  const [bump, setBump] = useState(0);
  const reload = () => setBump((x) => x + 1);

  // 최신 요청만 반영하도록 request id 보관
  const reqIdRef = useRef(0);

  useEffect(() => {
    const id = ++reqIdRef.current;
    const ctrl = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const { data: res } = await api.get("/mypage/purchase", {
          params: { page, size, status, sort },
          signal: ctrl.signal,
        });

        // 응답 형태 방어
        const itemsRaw: unknown[] = Array.isArray(res)
          ? (res as unknown[])
          : Array.isArray((res as any)?.items)
            ? (res as any).items
            : [];

        const mapped: TradeItem[] = itemsRaw.map(fromPurchase);

        // 최신 요청만 반영
        if (reqIdRef.current !== id) return;

        setData(mapped);
        setTotal(
          typeof (res as any)?.total === "number"
            ? (res as any).total
            : mapped.length
        );
      } catch (err: any) {
        if (ctrl.signal.aborted) return;
        if (reqIdRef.current !== id) return;

        setError(err);
        setData([]);
        setTotal(0);
      } finally {
        if (reqIdRef.current === id) setLoading(false);
      }
    }

    run();
    return () => ctrl.abort();
  }, [page, size, status, sort, bump]);

  return { data, total, loading, error, reload };
}
