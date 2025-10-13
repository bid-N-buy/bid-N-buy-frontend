import { create } from "zustand";
import type { AuctionDetail } from "../types/auctions";
import { getAuctionById } from "../api/auctions";

interface AuctionDetailState {
  detail: AuctionDetail | null;
  loading: boolean;
  error: string | null;
  load: (id: number) => Promise<void>;
  reset: () => void;
}

export const useAuctionDetailStore = create<AuctionDetailState>((set) => ({
  detail: null,
  loading: false,
  error: null,
  load: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const data = await getAuctionById(id);
      set({ detail: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? "불러오기 실패", loading: false });
    }
  },
  reset: () => set({ detail: null, loading: false, error: null }),
}));
