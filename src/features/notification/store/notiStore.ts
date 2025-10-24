// new 알림 뱃지(빨간점) 용도 zustand store 사용

import { create } from "zustand";
import type { NotiListProps } from "../types/NotiType";

interface NotiState {
  notis: NotiListProps[];
  setNotis: (list: NotiListProps[]) => void;
  addNoti: (noti: NotiListProps) => void;
}

export const useNotiStore = create<NotiState>((set) => ({
  notis: [],
  setNotis: (list) => set({ notis: list }),
  addNoti: (noti) => set((s) => ({ notis: [noti, ...s.notis] })),
}));