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

  // 알 수 없는 경우 찜 목록에서는 보통 "끝난 상품" 취급
  return "FINISH";
};

/* =========================
 * 상대 경로 -> 절대 경로
 * ========================= */
const absolutize = (url?: string | null): string | null => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const API_BASE =
    import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE}${path}`;
};

/* =========================
 * 서버 응답 1건 -> TradeItem
 * ========================= */
const fromWish = (r: any): TradeItem => {
  // 1) 대표 이미지
  let candidate: string | null = null;

  // 스타일 1: wish 리스트용
  if (r.mainImageUrl) {
    candidate = r.mainImageUrl;
  }

  // 스타일 2: /auctions/{id}에서 오는 images 배열
  if (!candidate && Array.isArray(r.images) && r.images.length > 0) {
    const mainImg = r.images.find((img: any) => {
      const t = String(img.imageType || "").toUpperCase();
      return t.includes("MAIN") && img.imageUrl;
    });
    const fallbackImg = r.images[0];
    candidate = (mainImg?.imageUrl || fallbackImg?.imageUrl) ?? null;
  }

  // 스타일 3: /mypage/purchase, /mypage/sales 등
  if (!candidate && r.itemImageUrl) {
    candidate = r.itemImageUrl;
  }

  // 기타 fallback
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

  // 3) 상태
  const statusText = r.statusText ?? r.sellingStatus ?? r.status ?? undefined;
  const status = toStatus(r.sellingStatus ?? r.status ?? r.statusText);

  // 4) 상대 닉네임(판매자 등)
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
};

export function useWishlist(opts: UseWishlistOpts = {}) {
  const { page = 0, size = 20, sort = "end" } = opts;

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

        // 서버가 배열을 바로 주거나 { items: [...] } 형태일 수도 있음
        const rawList: any[] = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

        const items: TradeItem[] = rawList.map(fromWish);

        if (!alive) return;
        setData(items);
      } catch (e) {
        if (!alive) return;
        setError(e);
        setData([]); // mock 없이 그냥 비움
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, size, sort]);

  // 정렬 보정
  const sorted = useMemo(() => {
    const arr = data.slice();
    return sort === "start"
      ? arr.sort(sortByStartDesc)
      : arr.sort(sortByEndDesc);
  }, [data, sort]);

  return { data: sorted, loading, error };
}
