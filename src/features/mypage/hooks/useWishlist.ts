// src/features/mypage/hooks/useWishlist.ts
import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem, TradeStatus } from "../types/trade";

/* =========================
 *      Status normalize
 * ========================= */
const toStatus = (raw?: string): TradeStatus => {
  const s = (raw ?? "").trim().toUpperCase();
  // COMPLETED: 거래/정산/수취 완료
  if (
    /COMPLETED|COMPLETE|TRANSACTION COMPLETE|거래완료|구매확정|수취완료|정산완료|완료됨/.test(
      s
    )
  )
    return "COMPLETED";
  // FINISH: 경매/판매 종료(마감/유찰/closed/ended)
  if (/FINISH|FINISHED|CLOSED|CLOSE|ENDED|END|종료|마감|유찰/.test(s))
    return "FINISH";
  // PROGRESS: 결제/배송/발송/진행중
  if (
    /PROGRESS|IN PROGRESS|WAIT|결제|배송|발송|처리중|진행중|PROCESS|SHIP|PAID|PAY/.test(
      s
    )
  )
    return "PROGRESS";
  // SALE: 판매/입찰 중
  if (/SALE|SELLING|BIDDING|입찰|판매중/.test(s)) return "SALE";
  // BEFORE: 등록 전/대기/비공개/검수
  if (/BEFORE|대기|준비중|등록전|비공개|검수/.test(s)) return "BEFORE";
  // 알 수 없으면 안전하게 종료로
  return "FINISH";
};

/* =========================
 *     API → TradeItem
 * ========================= */
const fromWish = (r: any): TradeItem => ({
  id: String(r.auctionId ?? r.id),
  title: r.title ?? r.itemName ?? "제목 없음",
  thumbUrl:
    r.thumbnailUrl ?? r.mainImageUrl ?? r.image ?? r.itemImageUrl ?? null,
  price: Number(r.currentPrice ?? r.price ?? r.finalPrice ?? 0) || 0,
  status: toStatus(r.sellingStatus ?? r.status ?? r.statusText),
  statusText: r.statusText ?? r.sellingStatus ?? r.status,
  counterparty:
    r.sellerNickname ?? r.seller ?? r.sellerName ?? r.nickname ?? undefined,
  auctionEnd: r.endTime ?? r.endAt,
  auctionStart: r.startTime ?? r.startAt,
});

/* =========================
 *     Client-side sort
 * ========================= */
const time = (v?: string) => (v ? new Date(v).getTime() || 0 : 0);
const sortByEndDesc = (a: TradeItem, b: TradeItem) =>
  time(b.auctionEnd) - time(a.auctionEnd);
const sortByStartDesc = (a: TradeItem, b: TradeItem) =>
  time(b.auctionStart) - time(a.auctionStart);

export type UseWishlistOpts = {
  page?: number;
  size?: number;
  sort?: "end" | "start"; // 기본 'end' (종료 임박/최근 종료 우선)
  useMock?: boolean;
};

export function useWishlist(opts: UseWishlistOpts = {}) {
  const { page = 0, size = 20, sort = "end", useMock = true } = opts;
  const [data, setData] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res } = await api.get("/wishs", {
          params: { page, size, sort },
        });
        const items: TradeItem[] = (res?.items ?? res ?? []).map(fromWish);
        if (!alive) return;
        setData(items);
      } catch (e) {
        if (!alive) return;
        setError(e);
        if (useMock) {
          // 동적 임포트로 번들 무게 최소화
          const m = await import("../mocks/tradeMocks");
          if (!alive) return;
          setData(m.MOCK_WISH);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, size, sort, useMock]);

  // 클라이언트 정렬 보정(서버가 보장 못해줄 때)
  const sorted = useMemo(() => {
    const arr = data.slice();
    return sort === "start"
      ? arr.sort(sortByStartDesc)
      : arr.sort(sortByEndDesc);
  }, [data, sort]);

  return { data: sorted, loading, error };
}
