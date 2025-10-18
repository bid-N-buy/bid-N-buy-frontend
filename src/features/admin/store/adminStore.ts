// 임시
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AdminId = number;

export interface AdminProfile {
  nickname: string;
  email?: string;
}

type AdminState = {
  token: string | null; // 관리자 액세스 토큰(임시)
  nickname: string | null;
  setToken: (
    access: string | null | undefined,
    refresh: string | null | undefined,
    profile?: Profile | null,
    adminId?: AdminId | null
  ) => void;
  clear: () => void;
  isAuthed: () => boolean;
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      token: null,
      nickname: null,

      setToken: (token) => set({ token }),
      clear: () => set({ token: null, nickname: null }),

      isAuthed: () => Boolean(get().token),
    }),
    {
      name: "admin-auth", // 스토리지 키 (일반 유저와 분리)
      storage: createJSONStorage(() => sessionStorage),
      // 👉 임시용이라 탭 닫으면 사라지도록 sessionStorage 사용.
      //   영구 보관하려면 localStorage로 바꾸세요.
      partialize: (state) => ({ token: state.token, nickname: state.nickname }),
    }
  )
);
