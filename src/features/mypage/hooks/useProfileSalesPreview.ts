// src/features/mypage/hooks/useProfileSalesPreview.ts
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export type Item = {
  id: number | string;
  title: string;
  thumbnail?: string;
};

export type SellingStatus =
  | "BEFORE"
  | "SALE"
  | "COMPLETED"
  | "PROGRESS"
  | "FINISH"
  | "UNKNOWN";

/** 🔧 상태 문자열 정규화 (Enum/한글표기 모두 커버) */
function normalizeStatus(raw?: string): SellingStatus {
  const s = (raw ?? "").toUpperCase().trim();
  if (["BEFORE", "경매전", "경매 전", "READY", "NOT_STARTED"].includes(s))
    return "BEFORE";
  if (
    [
      "SALE",
      "진행 중",
      "IN_PROGRESS",
      "RUNNING",
      "ON_SALE",
      "BIDDING",
    ].includes(s)
  )
    return "SALE";
  if (
    [
      "COMPLETED",
      "FINISH",
      "경매 완료",
      "종료",
      "ENDED",
      "CLOSED",
      "DONE",
      "낙찰 완료",
      "거래 완료",
      "결제 완료",
    ].includes(s)
  )
    return "COMPLETED";
  if (
    [
      "PROGRESS",
      "결재 중",
      "결제 중",
      "PAYMENT",
      "PAYING",
      "PAYMENT_PENDING",
    ].includes(s)
  )
    return "PROGRESS";
  return "UNKNOWN";
}

/** 🧪 statusText 안에서 키워드로 완료 판정 */
function looksCompletedByText(text?: string): boolean {
  const t = (text ?? "").toLowerCase();
  // 필요 키워드 자유롭게 보강 가능
  return (
    t.includes("낙찰 완료") ||
    t.includes("거래 완료") ||
    t.includes("결제 완료") ||
    t.includes("완료") ||
    t.includes("종료") ||
    t.includes("closed") ||
    t.includes("ended") ||
    t.includes("done")
  );
}

/** 🕒 endTime 보정: 끝난 시각이 현재 이전이면 완료 취급 보조 */
function isFinishedByTime(end?: string): boolean {
  if (!end) return false;
  const t = new Date(end).getTime();
  return Number.isFinite(t) && t <= Date.now();
}

/** ✅ /auctions/{id} 응답 타입(필요 필드만) */
type AuctionDetail = {
  auctionId: number;
  title: string;
  images?: { imageUrl: string; imageType: "MAIN" | "PRODUCT" | string }[];
  sellingStatus?: string; // 예: "진행 중"
};

/** ✅ /mypage/sales 아이템(필요 필드만) */
type MySalesItem = {
  auctionId: number;
  title: string;
  itemImageUrl?: string;
  endTime?: string;
  finalPrice?: number;
  winnerNickname?: string;
  statusText?: string; // 예: "결제 대기 중 (진행 중)"
};

/** ✅ /users/{userId}/purchases 아이템(필요 필드만) */
type PurchaseItem = {
  auctionId: number;
  title: string;
  itemImageUrl?: string;
  startTime?: string;
  endTime?: string;
  finalPrice?: number;
  winnerNickname?: string;
  statusText?: string; // "낙찰 완료", "거래 중" 등
};

const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

/**
 * 사용법:
 * const { sellingPreview, soldPreview, sellingCount, soldCount, loading, error } =
 *   useProfileSalesPreview({ ongoingIds: [3,5,10], targetUserId: 123 });
 *
 * - ongoingIds: "진행/경매전" 아이템들의 auctionId 리스트
 * - targetUserId: 다른 유저 프로필에서 구매(=완료) 내역을 보여줄 때 필요
 *   - 있으면 /users/{userId}/purchases
 *   - 없으면 내 마이페이지 기준(/mypage/sales)
 */
export function useProfileSalesPreview({
  ongoingIds,
  targetUserId,
}: {
  ongoingIds: number[];
  targetUserId?: number | string; // 다른 유저 프로필일 때 전달
}) {
  const [sellingPreview, setSellingPreview] = useState<Item[]>([]);
  const [soldPreview, setSoldPreview] = useState<Item[]>([]);
  const [sellingCount, setSellingCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        // ──────────────────────────────────────────────────────────
        // 1) 진행/경매전: /auctions/{id} 상세를 각각 조회해서 상태 확인
        // ──────────────────────────────────────────────────────────
        const sellingDetails: AuctionDetail[] = await Promise.all(
          (ongoingIds ?? []).map(async (id) => {
            const { data } = await axios.get<AuctionDetail>(
              `${BASE}/auctions/${id}`,
              { withCredentials: true }
            );
            return data;
          })
        );

        const sellingOk = sellingDetails
          .filter((d) => {
            const norm = normalizeStatus(d.sellingStatus);
            return norm === "BEFORE" || norm === "SALE";
          })
          .map<Item>((d) => ({
            id: d.auctionId,
            title: d.title,
            thumbnail:
              d.images?.find((i) => i.imageType === "MAIN")?.imageUrl ??
              d.images?.[0]?.imageUrl ??
              undefined,
          }));

        // ──────────────────────────────────────────────────────────
        // 2) 판매 완료(=거래 완료/낙찰 완료 등) 프리뷰
        //    - targetUserId 있으면 공개용: /users/{userId}/purchases
        //    - 없으면 내 마이페이지: /mypage/sales
        // ──────────────────────────────────────────────────────────
        let soldItems: Item[] = [];
        if (targetUserId != null) {
          // ✅ 다른 유저 프로필: 그 유저의 "구매 완료"를 보여줌
          const { data: purchases } = await axios.get<PurchaseItem[]>(
            `${BASE}/users/${targetUserId}/purchases`,
            { withCredentials: true }
          );

          const completed = (purchases ?? []).filter((p) => {
            // 1) statusText로 완료 판정
            if (looksCompletedByText(p.statusText)) return true;
            // 2) 시간 보정(endTime 지난 경우) + 낙찰자 존재 시 완료 취급
            if (isFinishedByTime(p.endTime) && !!p.winnerNickname) return true;
            return false;
          });

          soldItems = completed.map<Item>((p) => ({
            id: p.auctionId,
            title: p.title,
            thumbnail: p.itemImageUrl,
          }));
        } else {
          // ✅ 내 마이페이지: 내가 올린 물건들의 상태(/mypage/sales)
          const { data: mySales } = await axios.get<MySalesItem[]>(
            `${BASE}/mypage/sales`,
            { withCredentials: true }
          );

          const completed = (mySales ?? []).filter((s) => {
            // 1) statusText로 완료 판정
            if (looksCompletedByText(s.statusText)) return true;
            // 2) 시간 보정(endTime 지난 경우) + 낙찰자 존재 시 완료 취급
            if (isFinishedByTime(s.endTime) && !!s.winnerNickname) return true;
            // 3) 혹시 백엔드가 Enum/한글을 직접 내려주는 경우
            const norm = normalizeStatus(s.statusText);
            return norm === "COMPLETED";
          });

          soldItems = completed.map<Item>((s) => ({
            id: s.auctionId,
            title: s.title,
            thumbnail: s.itemImageUrl,
          }));
        }

        if (!alive) return;

        // ──────────────────────────────────────────────────────────
        // 프리뷰(최대 3개), 카운트(전체 길이)
        // ──────────────────────────────────────────────────────────
        setSellingPreview(sellingOk.slice(0, 3));
        setSellingCount(sellingOk.length);
        setSoldPreview(soldItems.slice(0, 3));
        setSoldCount(soldItems.length);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message ?? "failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // ongoingIds 배열이 변경될 때만 다시 실행되도록 문자열 조인
  }, [ongoingIds.join(","), String(targetUserId ?? "")]);

  return {
    sellingPreview,
    soldPreview,
    sellingCount,
    soldCount,
    loading,
    error,
  };
}
