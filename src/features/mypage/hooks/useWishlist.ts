// src/features/mypage/hooks/useWishlist.ts
import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import type { TradeItem, TradeStatus } from "../types/trade";

/* =========================
 * 날짜 유틸
 * ========================= */
const toMs = (v?: string) => {
  if (!v) return NaN;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : NaN;
};
const nowMs = () => Date.now();

/* =========================
 * 상태 문자열 + 시간 -> 내부 상태 코드
 *  - end <= now  → FINISH
 *  - start > now → BEFORE
 *  - 그 외 키워드 매핑
 *  - 모호하면 SALE(가시성 보수적)
 * ========================= */
const toStatus = (
  raw?: string,
  startAt?: string,
  endAt?: string
): TradeStatus => {
  const s = (raw ?? "").toString().trim().toUpperCase();

  // 0) 시간 우선 보정
  const start = toMs(startAt);
  const end = toMs(endAt);

  if (Number.isFinite(end) && end <= nowMs()) return "FINISH";
  if (Number.isFinite(start) && start > nowMs()) return "BEFORE";

  // 1) 명확한 완료/종료
  if (
    /COMPLETED|COMPLETE|TRANSACTION COMPLETE|거래완료|구매확정|수취완료|정산완료|완료됨/.test(
      s
    )
  )
    return "COMPLETED";
  if (/FINISH|FINISHED|CLOSED|CLOSE|ENDED|END|종료|마감|유찰/.test(s))
    return "FINISH";

  // 2) 결제/배송/진행
  if (
    /PROGRESS|IN PROGRESS|WAIT|결제|배송|발송|처리중|진행중|PROCESS|SHIP|PAID|PAY/.test(
      s
    )
  )
    return "PROGRESS";

  // 3) 판매/입찰 중
  if (/SALE|SELLING|BIDDING|입찰|판매중/.test(s)) return "SALE";
  if (/BEFORE|대기|준비중|등록전|비공개|검수/.test(s)) return "BEFORE";

  // 4) 모호하면 '진행/판매 중'으로 표기
  return "SALE";
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
  // r.deadline ?? r.deadlineAt ??  // 배송/기타 마감 혼동은 제외 권장
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
    r.currentPrice ?? r.finalPrice ?? r.price ?? r.myBidPrice ?? r.bidPrice;
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

  const auctionStart = pickAuctionStart(r);
  const auctionEnd = pickAuctionEnd(r);

  const statusText = r.statusText ?? r.sellingStatus ?? r.status ?? undefined;
  let status = toStatus(statusText, auctionStart, auctionEnd); // 기존 판단

  // ✅ 최소 수정: 시작 전이면 무조건 BEFORE, 비정상(end < start)도 BEFORE로 보정
  const start = toMs(auctionStart);
  const end = toMs(auctionEnd);
  const now = nowMs();
  if (Number.isFinite(start) && start > now) {
    status = "BEFORE";
  } else if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
    status = "BEFORE";
  }

  const counterparty =
    r.sellerNickname ??
    r.winnerNickname ??
    r.seller ??
    r.sellerName ??
    r.nickname ??
    undefined;

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
 * 진행/종료 판별 유틸 (UI 분류용)
 *  - 진행중: 시작했고(!before) 아직 안 끝남(!ended)
 *  - 종료: end <= now 또는 상태 COMPLETED/FINISH
 * ========================= */
export const isBeforeStart = (it: TradeItem): boolean => {
  const start = toMs(it.auctionStart);
  return Number.isFinite(start) && start > Date.now();
};

export const isEndedByTime = (it: TradeItem): boolean => {
  const end = toMs(it.auctionEnd);
  return Number.isFinite(end) && end <= Date.now();
};

export const isEndedByStatus = (it: TradeItem): boolean => {
  const s = (it.status ?? "").toUpperCase();
  const t = (it.statusText ?? "").toUpperCase();
  if (s === "COMPLETED" || s === "FINISH") return true;
  if (
    /(COMPLETED|COMPLETE|TRANSACTION COMPLETE|거래완료|구매확정|수취완료|정산완료)/.test(
      t
    )
  )
    return true;
  if (/(FINISH|FINISHED|CLOSED|CLOSE|ENDED|END|종료|마감|유찰)/.test(t))
    return true;
  return false;
};

export const isEnded = (it: TradeItem) =>
  isEndedByTime(it) || isEndedByStatus(it);
export const isOngoing = (it: TradeItem) => !isBeforeStart(it) && !isEnded(it);

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

  // ✅ 탭용 파생 데이터 & 카운트
  const ongoing = useMemo(() => sorted.filter(isOngoing), [sorted]);
  const ended = useMemo(() => sorted.filter(isEnded), [sorted]);
  const counts = useMemo(
    () => ({
      all: sorted.length,
      ongoing: ongoing.length,
      ended: ended.length,
    }),
    [sorted, ongoing.length, ended.length]
  );

  return {
    data: sorted,
    loading,
    error,
    // 탭 분류용
    ongoing,
    ended,
    counts,
    // 필요하면 UI에서 직접 판별도 가능
    isBeforeStart,
    isOngoing,
    isEnded,
  };
}
