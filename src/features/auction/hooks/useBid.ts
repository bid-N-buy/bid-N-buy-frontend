import { useState, useCallback } from "react";
import type { PostBidResponse } from "../types/auctions";
import { postBid } from "../api/auctions";

interface UseBidOptions {
  onSuccess?: (res: PostBidResponse) => void;
  onError?: (errMsg: string) => void;
}

export function useBid({ onSuccess, onError }: UseBidOptions = {}) {
  const [loading, setLoading] = useState(false);

  const submitBid = useCallback(
    async (params: { auctionId: number; userId: number; bidPrice: number }) => {
      setLoading(true);
      try {
        const res = await postBid(params.auctionId, params.userId, {
          bidPrice: params.bidPrice,
        });
        // api 내부 에러 필드 우선 확인
        if (res.error) {
          onError?.(res.error);
          throw new Error(res.error);
        }
        onSuccess?.(res);
        return res;
      } catch (e: any) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "입찰 처리 중 오류가 발생했습니다.";
        onError?.(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  return { submitBid, loading };
}
