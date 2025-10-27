// 임시
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AdminId = number;

export interface AdminProfile {
  nickname: string;
  email?: string;
}

export interface AdminState {
  accessToken: string | null;
  refreshToken: string | null;
  // profile: AdminProfile | null;
  adminId: AdminId | null;

  setTokens: (
    access: string | null | undefined,
    refresh: string | null | undefined,
    // profile?: AdminProfile | null,
    adminId?: AdminId | null
  ) => void;

  // setAdminProfile: (p: AdminProfile | null) => void;

  setAdminId: (id: AdminId | null) => void;

  /** 액세스 토큰만 갱신 (인터셉터에서 /auth/reissue 성공 시 호출) */
  updateAccessToken: (access: string | null | undefined) => void;

  clear: () => void;
}

export const useAdminAuthStore = create<AdminState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      // profile: null,
      adminId: null,

      setTokens: (
        access,
        refresh,
        // profile = null,
        adminId = undefined
      ) =>
        set((s) => ({
          accessToken: access ?? null, // undefined 방지
          refreshToken: refresh ?? null,
          // profile: profile ?? s.profile,
          adminId:
            typeof adminId === "undefined" ? s.adminId : (adminId ?? null), // 명시 전달 시에만 변경
        })),

      // setAdminProfile: (p) => set({ profile: p }),

      setAdminId: (id) => set({ adminId: id }),

      updateAccessToken: (access) => set({ accessToken: access ?? null }),

      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          // profile: null,
          adminId: null,
        }),
    }),
    {
      name: "admin-auth", // 스토리지 키 (일반 유저와 분리)
      storage: createJSONStorage(() => sessionStorage),
      // 👉 임시용이라 탭 닫으면 사라지도록 sessionStorage 사용.
      //   영구 보관하려면 localStorage로 바꾸세요.
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        // profile: s.profile,
        adminId: s.adminId, // ✅ adminId를 반드시 persist
      }),
    }
  )
);

export const useAccessToken = () => useAdminAuthStore((s) => s.accessToken);
// export const useAdminProfile = () => useAdminAuthStore((s) => s.profile);
export const useAdminId = () => useAdminAuthStore((s) => s.adminId);
