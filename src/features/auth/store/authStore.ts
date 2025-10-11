import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Profile {
  nickname: string;
  email?: string;
}
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  profile: Profile | null;
  setTokens: (a: string | null, r: string | null, p?: Profile | null) => void;
  setProfile: (p: Profile | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      profile: null,
      setTokens: (a, r, p = null) =>
        set((s) => ({
          accessToken: a,
          refreshToken: r,
          profile: p ?? s.profile,
        })),
      setProfile: (p) => set({ profile: p }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, profile: null }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => sessionStorage), // dev: sessionStorage
      // partialize: (s) => ({ refreshToken: s.refreshToken }), // 원하면 최소 저장
    }
  )
);
