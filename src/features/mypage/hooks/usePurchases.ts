// src/features/mypage/hooks/usePurchases.ts
import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem } from "../types/trade";
import { fromPurchase } from "../utils/tradeMappers"; // 서버응답 → TradeItem 변환
import { MOCK_PURCHASES } from "../mocks/tradeMocks";

type Options = {
  page?: number;
  size?: number;
  status?: string;
  sort?: "end" | "start";
  useMock?: boolean; // 데이터 없을 때 목업 대체
};

export function usePurchases(opts: Options = {}) {
  const {
    page = 0,
    size = 20,
    status,
    sort = "end",
    useMock = import.meta.env.DEV, // 개발모드에서만 목업 활성화
  } = opts;

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
        // ✅ 서버에서 바로 배열 리턴
        const { data: res } = await api.get("/mypage/purchase", {
          params: { page, size, status, sort },
        });

        // ✅ 배열인지 체크 (API 응답이 배열이거나 items 배열로 감싸져 있을 수도 있음)
        const list: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

        const items: TradeItem[] = list.map(fromPurchase);

        if (!alive) return;

        if (useMock && items.length === 0) {
          setData(MOCK_PURCHASES);
          setTotal(MOCK_PURCHASES.length);
        } else {
          setData(items);
          setTotal(typeof res?.total === "number" ? res.total : items.length);
        }
      } catch (err) {
        if (!alive) return;
        setError(err);

        // 개발 모드에서는 에러 시 목업 보여주기
        if (useMock) {
          setData(MOCK_PURCHASES);
          setTotal(MOCK_PURCHASES.length);
        } else {
          setData([]);
          setTotal(0);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, size, status, sort, useMock]);

  return {
    data,
    total,
    loading,
    error,
    reload: () => {
      // 원하면 refetch 기능 추가 가능
    },
  };
}
