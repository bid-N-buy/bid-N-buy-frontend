import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type {
  TradeItem,
  PurchaseResponseItem,
  SaleResponseItem,
} from "../types/trade";

// --- 상태 공통화 도우미 (필요시 추가)
const STATUS_MAP = new Map<string, TradeItem["status"]>([
  ["BIDDING", "입찰 중"],
  ["WIN", "낙찰"],
  ["CLOSED", "마감"],
  ["PENDING", "대기"],
  ["입찰 중", "입찰 중"],
  ["낙찰", "낙찰"],
  ["마감", "마감"],
  ["대기", "대기"],
]);
const toStatus = (s?: string): TradeItem["status"] =>
  STATUS_MAP.get((s ?? "").toUpperCase()) ?? "대기";

// --- 서버 응답 -> 공통 모델 정규화
const fromPurchase = (r: PurchaseResponseItem): TradeItem => ({
  id: String(r.id),
  title: r.itemName,
  sellerName: r.seller,
  thumbUrl: r.thumbnail,
  status: toStatus(r.status),
  auctionStart: r.startAt,
  auctionEnd: r.endAt,
});

const fromSale = (r: SaleResponseItem): TradeItem => ({
  id: String(r.id),
  title: r.title,
  sellerName: r.meAsSeller,
  thumbUrl: r.image,
  status: toStatus(r.status),
  auctionStart: r.startAt,
  auctionEnd: r.endAt,
});

type UseMyTradesOptions = {
  /** 정렬 기준: 기본은 종료 시각 최신순 */
  sortBy?: "auctionEnd" | "auctionStart";
  /** 최초 1회만 가져오고 이후 정적이면 true (기본 false) */
  once?: boolean;
};

export function useMyTrades(opts: UseMyTradesOptions = {}) {
  const { sortBy = "auctionEnd", once = false } = opts;

  const [purchases, setPurchases] = useState<TradeItem[]>([]);
  const [sales, setSales] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ 엔드포인트는 실제 API에 맞춰 수정하세요
      const [pRes, sRes] = await Promise.all([
        api.get<PurchaseResponseItem[]>("/mypage/purchase"),
        api.get<SaleResponseItem[]>("/mypage/sales"),
      ]);

      const p = (pRes.data ?? []).map(fromPurchase);
      const s = (sRes.data ?? []).map(fromSale);

      // 최신순 정렬
      const key = sortBy === "auctionEnd" ? "auctionEnd" : "auctionStart";
      const sorter = (a: TradeItem, b: TradeItem) =>
        new Date(b[key] ?? 0).getTime() - new Date(a[key] ?? 0).getTime();

      setPurchases(p.sort(sorter));
      setSales(s.sort(sorter));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // once=true면 마운트 1회 이후 재요청 안 함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, once]);

  // 필요한 값들 반환
  return {
    purchases,
    sales,
    loading,
    error,
    reload: fetchAll,
  };
}

export default useMyTrades;
