// src/features/mypage/hooks/useWishlist.ts
import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem, TradeStatus } from "../types/trade";

/* =========================
 * 상태 문자열 -> 내부 상태 코드
 * ========================= */
const toStatus = (raw?: string): TradeStatus => {
  const s = (raw ?? "").toString().trim().toUpperCase();

  // 명확한 완료/종료 우선
  if (
    /COMPLETED|COMPLETE|TRANSACTION COMPLETE|거래완료|구매확정|수취완료|정산완료|완료됨/.test(
      s
    )
  )
    return "COMPLETED";

  if (/FINISH|FINISHED|CLOSED|CLOSE|ENDED|END|종료|마감|유찰/.test(s))
    return "FINISH";

  // 결제/배송/진행 단계
  if (
    /PROGRESS|IN PROGRESS|WAIT|결제|배송|발송|처리중|진행중|PROCESS|SHIP|PAID|PAY/.test(
      s
    )
  )
    return "PROGRESS";

  if (/SALE|SELLING|BIDDING|입찰|판매중/.test(s)) return "SALE";
  if (/BEFORE|대기|준비중|등록전|비공개|검수/.test(s)) return "BEFORE";

  // 알 수 없으면 위시에서는 보수적으로 종료 취급(리스트에서 사라진 경우 등)
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
 * 필드 픽커 (start/end/image/price 강화)
 * ========================= */
const pickAuctionStart = (r: any): string | undefined =>
  r.startAt ??
  r.startTime ??
  r.auctionStart ??
  r.startedAt ??
  r.openAt ??
  r.openTime ??
  r.beginAt ??
  undefined;

const pickAuctionEnd = (r: any): string | undefined =>
  r.endTime ??
  r.endAt ??
  r.endedAt ??
  r.closeAt ??
  r.closeTime ??
  r.closedAt ??
  r.expireAt ??
  r.expiredAt ??
  r.auctionEnd ??
  r.deadline ??
  r.deadlineAt ??
  undefined;

const pickThumbUrl = (r: any): string | null => {
  // 1) wish 전용
  if (r.mainImageUrl) return absolutize(r.mainImageUrl);
  // 2) 상세 images[]
  if (Array.isArray(r.images) && r.images.length > 0) {
    const main = r.images.find((img: any) =>
      String(img.imageType ?? "")
        .toUpperCase()
        .includes("MAIN")
    );
    const src = main?.imageUrl ?? r.images[0]?.imageUrl ?? null;
    if (src) return absolutize(src);
  }
  // 3) 마이페이지 응답 계열
  const cand =
    r.itemImageUrl ??
    r.thumbnailUrl ??
    r.thumbnail ??
    r.imgUrl ??
    r.imageUrl ??
    r.productImageUrl ??
    r.image ??
    null;
  return absolutize(cand);
};

const pickPrice = (r: any): number | undefined => {
  const raw =
    r.currentPrice ??
    r.finalPrice ??
    r.price ??
    r.myBidPrice ??
    r.bidPrice ??
    undefined;

  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

/* =========================
 * 서버 응답 1건 -> TradeItem
 * ========================= */
const fromWish = (r: any): TradeItem => {
  const id =
    r.auctionId ?? r.id ?? r.auction_id ?? r.auctionID ?? r.itemId ?? "";
  const title = r.title ?? r.itemName ?? r.auctionTitle ?? "제목 없음";

  const thumbUrl = pickThumbUrl(r);
  const price = pickPrice(r);

  const statusText = r.statusText ?? r.sellingStatus ?? r.status ?? undefined;
  const status = toStatus(statusText);

  const counterparty =
    r.sellerNickname ??
    r.winnerNickname ??
    r.seller ??
    r.sellerName ??
    r.nickname ??
    undefined;

  const auctionStart = pickAuctionStart(r);
  const auctionEnd = pickAuctionEnd(r);

  return {
    id: String(id),
    title,
    thumbUrl: thumbUrl ?? undefined,
    price,
    status,
    statusText,
    counterparty,
    auctionStart,
    auctionEnd,
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

        // 서버가 배열 또는 {items:[]} 가능
        const raw: any[] = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

        const items = raw.map(fromWish);

        if (!alive) return;
        setData(items);
      } catch (e) {
        if (!alive) return;
        setError(e);
        setData([]);
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
