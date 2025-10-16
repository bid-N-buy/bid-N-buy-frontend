import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem, TradeRole } from "../types/trade";

export function useTradeHistory(role: TradeRole) {
  const [items, setItems] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // ✅ API 경로만 역할로 분기
        const url = role === "buyer" ? "/mypage/purchases" : "/mypage/sales";
        const { data } = await api.get<TradeItem[]>(url);
        if (!alive) return;
        setItems(data ?? []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message ?? "목록을 불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [role]);

  // 간단 통계(디자인 상단 숫자 3개)
  const stats = {
    total: items.length,
    waiting: items.filter((i) => i.status === "WAIT_PAY").length,
    done: items.filter((i) => i.status === "DONE").length,
  };

  return { items, loading, error, stats };
}
