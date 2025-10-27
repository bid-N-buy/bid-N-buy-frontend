// src/features/mypage/hooks/useWishlist.ts
import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem, TradeStatus } from "../types/trade";

/* =========================
 * 상태 문자열 -> 내부 상태 코드
 * ========================= */
const toStatus = (raw?: string): TradeStatus => {
  const s = (raw ?? "").trim().toUpperCase();

  if (
    /COMPLETED|COMPLETE|TRANSACTION COMPLETE|거래완료|구매확정|수취완료|정산완료|완료됨/.test(
      s
    )
  )
    return "COMPLETED";

  if (/FINISH|FINISHED|CLOSED|CLOSE|ENDED|END|종료|마감|유찰/.test(s))
    return "FINISH";

  if (
    /PROGRESS|IN PROGRESS|WAIT|결제|배송|발송|처리중|진행중|PROCESS|SHIP|PAID|PAY/.test(
      s
    )
  )
    return "PROGRESS";

  if (/SALE|SELLING|BIDDING|입찰|판매중/.test(s)) return "SALE";

  if (/BEFORE|대기|준비중|등록전|비공개|검수/.test(s)) return "BEFORE";

  return "FINISH";
};

/* =========================
 * 상대 경로 -> 절대 경로
 * ========================= */
const absolutize = (url?: string | null): string | null => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url; // 이미 절대 URL이면 그대로

  const API_BASE =
    import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE}${path}`;
};

/* =========================
 * 서버 응답 1건 -> TradeItem
 * (/wishs, /mypage/purchase, /mypage/sales 등 공통 대응)
 * ========================= */
const fromWish = (r: any): TradeItem => {
  // 1) 대표 이미지 고르기
  let candidate: string | null = null;

  // /wishs style
  if (r.mainImageUrl) {
    candidate = r.mainImageUrl;
  }

  // /auctions/{id} style
  if (!candidate && Array.isArray(r.images) && r.images.length > 0) {
    const mainImg = r.images.find((img: any) => {
      const t = String(img.imageType || "").toUpperCase();
      return t.includes("MAIN") && img.imageUrl;
    });
    const fallbackImg = r.images[0];
    candidate = (mainImg?.imageUrl || fallbackImg?.imageUrl) ?? null;
  }

  // /mypage/purchase or /mypage/sales style
  if (!candidate && r.itemImageUrl) {
    candidate = r.itemImageUrl;
  }

  // fallback candidates
  if (!candidate) {
    candidate =
      r.thumbnailUrl ??
      r.imgUrl ??
      r.imageUrl ??
      r.productImageUrl ??
      r.image ??
      null;
  }

  const thumbUrl = absolutize(candidate);

  // 2) 가격
  const priceNum =
    typeof r.currentPrice === "number"
      ? r.currentPrice
      : typeof r.finalPrice === "number"
        ? r.finalPrice
        : typeof r.price === "number"
          ? r.price
          : 0;

  // 3) 상태 텍스트 및 내부화된 상태코드
  const statusText = r.statusText ?? r.sellingStatus ?? r.status ?? undefined;
  const status = toStatus(r.sellingStatus ?? r.status ?? r.statusText);

  // 4) 판매자/상대방 닉네임
  const counterparty =
    r.sellerNickname ??
    r.winnerNickname ??
    r.seller ??
    r.sellerName ??
    r.nickname ??
    undefined;

  return {
    id: String(r.auctionId ?? r.id ?? ""),
    title: r.title ?? r.itemName ?? "제목 없음",

    thumbUrl,

    price: priceNum,
    status,
    statusText,

    counterparty,

    auctionEnd: r.endTime ?? r.endAt,
    auctionStart: r.startTime ?? r.startAt,
  };
};

/* =========================
 * 정렬 유틸
 * ========================= */
const time = (v?: string) => (v ? new Date(v).getTime() || 0 : 0);

const sortByEndDesc = (a: TradeItem, b: TradeItem) =>
  time(b.auctionEnd) - time(a.auctionEnd);

const sortByStartDesc = (a: TradeItem, b: TradeItem) =>
  time(b.auctionStart) - time(a.auctionStart);

/* =========================
 * 훅
 * ========================= */
export type UseWishlistOpts = {
  page?: number;
  size?: number;
  sort?: "end" | "start"; // 기본 'end'
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

        // 서버가 배열을 바로 줄 수도 있고 {items: [...]} 로 줄 수도 있으니 방어
        const list = Array.isArray(res?.items) ? res.items : res;
        const items: TradeItem[] = (list ?? []).map(fromWish);

        if (!alive) return;
        setData(items);
      } catch (e) {
        if (!alive) return;
        setError(e);

        if (useMock) {
          const m = await import("../mocks/tradeMocks");
          if (!alive) return;
          setData(m.MOCK_WISH.map(fromWish));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, size, sort, useMock]);

  // 정렬 보정
  const sorted = useMemo(() => {
    const arr = data.slice();
    return sort === "start"
      ? arr.sort(sortByStartDesc)
      : arr.sort(sortByEndDesc);
  }, [data, sort]);

  return { data: sorted, loading, error };
}
