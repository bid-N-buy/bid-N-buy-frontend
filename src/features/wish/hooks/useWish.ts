import { useMemo, useCallback } from "react";
import { useWishStore } from "../store/useWishStore";
import type { WishState } from "../types/wish";
import useToast from "../../../shared/hooks/useToast";
import axios from "axios";

interface UseWishOptions {
  auctionId: number;
  initial?: WishState; // { liked, wishCount }
}

export const useWish = ({ auctionId, initial }: UseWishOptions) => {
  const prime = useWishStore((s) => s.prime);
  const toggleRaw = useWishStore((s) => s.toggleRaw);
  const state = useWishStore((s) => s.byId[auctionId]);
  const loadingIds = useWishStore((s) => s.loadingIds);
  const { showToast } = useToast();

  if (initial) prime(auctionId, initial);

  const loading = useMemo(
    () => loadingIds.has(auctionId),
    [loadingIds, auctionId]
  );
  const liked = state?.liked ?? initial?.liked ?? false;
  const wishCount = state?.wishCount ?? initial?.wishCount ?? 0;

  const toggle = useCallback(async () => {
    try {
      await toggleRaw(auctionId);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        showToast("로그인이 필요합니다.", "error");
        return;
      }
      showToast("찜 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.", "error");
    }
  }, [toggleRaw, auctionId, showToast]);

  return { liked, wishCount, loading, toggle };
};
