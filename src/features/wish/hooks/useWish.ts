import { useEffect, useMemo, useCallback } from "react";
import { useWishStore } from "../store/useWishStore";
import type { WishState } from "../types/wish";
import useToast from "../../../shared/hooks/useToast";
import axios from "axios";
import { useAuthStore } from "../../auth/store/authStore";

interface UseWishOptions {
  auctionId: number;
  initial?: WishState; // { liked, wishCount }
  sellerId?: number; // 본인 체크 추가..
}

export const useWish = ({ auctionId, initial, sellerId }: UseWishOptions) => {
  const prime = useWishStore((s) => s.prime);
  const toggleRaw = useWishStore((s) => s.toggleRaw);
  const state = useWishStore((s) => s.byId[auctionId]);
  const loadingIds = useWishStore((s) => s.loadingIds);
  const { showToast } = useToast();
  const userId = useAuthStore((s) => s.userId); // 현재 로그인 유저

  useEffect(() => {
    if (!state && initial) {
      prime(auctionId, initial);
    }
  }, [state, initial, auctionId, prime]);

  const loading = useMemo(
    () => loadingIds.has(auctionId),
    [loadingIds, auctionId]
  );
  const liked = state?.liked ?? initial?.liked ?? false;
  const wishCount = state?.wishCount ?? initial?.wishCount ?? 0;

  const toggle = useCallback(async () => {
    // 가드 추가
    if (sellerId && userId && sellerId === userId) {
      showToast("본인의 상품은 찜할 수 없습니다.", "error");
      return;
    }

    try {
      await toggleRaw(auctionId);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        showToast("로그인이 필요합니다.", "error");
        return;
      }
      showToast("찜하기에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error");
    }
  }, [sellerId, userId, toggleRaw, auctionId, showToast]);

  return { liked, wishCount, loading, toggle };
};
