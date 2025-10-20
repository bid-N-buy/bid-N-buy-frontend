import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem } from "../types/trade";
import { fromPurchase } from "../utils/tradeMappers"; // 서버응답 -> TradeItem 변환 함수
import { MOCK_PURCHASES } from "../mocks/tradeMocks";

type Options = {
  page?: number;
  size?: number;
  status?: string;
  sort?: "end" | "start";
  useMock?: boolean; // 🔸추가: 데이터 없을 때 목업 대체
};

export function usePurchases(opts: Options = {}) {
  const {
    page = 0,
    size = 20,
    status,
    sort = "end",
    useMock = import.meta.env.DEV, // 기본: 개발모드에서만 목업 자동활성
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
        const { data: res } = await api.get("/mypage/purchase", {
          params: { page, size, status, sort },
        });
        const items = (res.items ?? res ?? []).map(fromPurchase) as TradeItem[];

        if (!alive) return;

        // 🔸목업 대체 로직
        if (useMock && items.length === 0) {
          setData(MOCK_PURCHASES);
          setTotal(MOCK_PURCHASES.length);
        } else {
          setData(items);
          setTotal(res.total ?? items.length);
        }
      } catch (e) {
        if (!alive) return;
        setError(e);
        // 🔸오류 시에도 개발모드면 목업 노출(원치 않으면 제거)
        if (useMock) {
          setData(MOCK_PURCHASES);
          setTotal(MOCK_PURCHASES.length);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, size, status, sort, useMock]);

  return { data, total, loading, error, reload: () => {} };
}
