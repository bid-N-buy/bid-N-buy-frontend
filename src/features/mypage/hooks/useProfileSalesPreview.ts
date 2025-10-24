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

const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

/**
 * 사용법:
 * const { sellingPreview, soldPreview, sellingCount, soldCount, loading, error } =
 *   useProfileSalesPreview({ ongoingIds: [3,5,10] });
 *
 * - ongoingIds: 현재 "내가 올린 경매 중 진행/경매전" 아이템들의 auctionId 리스트
 *   (대개 /mypage/my-auctions 같은 목록에서 얻은 id 배열)
 */
export function useProfileSalesPreview({
  ongoingIds,
}: {
  ongoingIds: number[];
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

        // 1) 진행/경매전: /auctions/{id} 상세를 각각 조회해서 상태 확인
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

        // 2) 완료/결제중/종료: /mypage/sales
        const { data: mySales } = await axios.get<MySalesItem[]>(
          `${BASE}/mypage/sales`,
          { withCredentials: true }
        );

        // statusText 안의 문구를 통해 "완료/결제중" 여부 판단
        const soldOk = (mySales ?? []).map<Item>((s) => ({
          id: s.auctionId,
          title: s.title,
          thumbnail: s.itemImageUrl,
        }));

        if (!alive) return;

        // 미리보기(최대 3개), 카운트(전체 길이)
        setSellingPreview(sellingOk.slice(0, 3));
        setSoldPreview(soldOk.slice(0, 3));
        setSellingCount(sellingOk.length);
        setSoldCount(soldOk.length);
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
  }, [ongoingIds.join(",")]);

  return {
    sellingPreview,
    soldPreview,
    sellingCount,
    soldCount,
    loading,
    error,
  };
}
