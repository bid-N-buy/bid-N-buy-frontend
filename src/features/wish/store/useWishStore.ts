import { create } from "zustand";
import type { WishState, WishToggleResponse } from "../types/wish";
import { toggleWish } from "../api/wish";

type WishMap = Record<number, WishState>;

interface WishStore {
  byId: WishMap;
  loadingIds: Set<number>;
  prime: (auctionId: number, init: WishState) => void;
  toggleRaw: (auctionId: number) => Promise<void>;
}

export const useWishStore = create<WishStore>((set, get) => ({
  byId: {},
  loadingIds: new Set<number>(),

  prime: (auctionId, init) => {
    const exists = !!get().byId[auctionId];
    if (exists) return;
    set((s) => ({
      byId: { ...s.byId, [auctionId]: init },
    }));
  },

  toggleRaw: async (auctionId: number) => {
    const { byId, loadingIds } = get();
    if (loadingIds.has(auctionId)) return;

    const prev = byId[auctionId] ?? { wishCount: 0, liked: false };
    const optimistic: WishState = {
      liked: !prev.liked,
      wishCount: prev.wishCount + (prev.liked ? -1 : 1),
    };

    set((s) => ({
      byId: { ...s.byId, [auctionId]: optimistic },
      loadingIds: new Set(s.loadingIds).add(auctionId),
    }));

    try {
      const res: WishToggleResponse = await toggleWish(auctionId);
      set((s) => {
        const next = new Set(s.loadingIds);
        next.delete(auctionId);
        return {
          byId: {
            ...s.byId,
            [auctionId]: { liked: res.liked, wishCount: res.wishCount },
          },
          loadingIds: next,
        };
      });
    } catch (err) {
      set((s) => {
        const next = new Set(s.loadingIds);
        next.delete(auctionId);
        return { byId: { ...s.byId, [auctionId]: prev }, loadingIds: next };
      });
      throw err;
    }
  },
}));
