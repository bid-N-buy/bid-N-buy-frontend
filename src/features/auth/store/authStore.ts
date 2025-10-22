// src/features/auth/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserId = number;
export interface Profile {
  nickname: string;
  email?: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  profile: Profile | null;
  userId: UserId | null;

  setTokens: (
    access: string | null | undefined,
    refresh: string | null | undefined,
    profile?: Profile | null,
    userId?: UserId | null
  ) => void;

  setProfile: (p: Profile | null) => void;
  setUserId: (id: UserId | null) => void;
  updateAccessToken: (access: string | null | undefined) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      profile: null,
      userId: null,

      setTokens: (access, refresh, profile = null, userId = undefined) =>
        set((s) => ({
          accessToken: access ?? null,
          refreshToken: refresh ?? null,
          profile: profile ?? s.profile,
          userId: typeof userId === "undefined" ? s.userId : (userId ?? null),
        })),

      setProfile: (p) => set({ profile: p }),
      setUserId: (id) => set({ userId: id }),
      updateAccessToken: (access) => set({ accessToken: access ?? null }),

      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          profile: null,
          userId: null,
        }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        profile: s.profile,
        userId: s.userId,
      }),
    }
  )
);

// 선택 셀렉터
export const useProfile = () => useAuthStore((s) => s.profile);
export const useUserId = () => useAuthStore((s) => s.userId);
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
