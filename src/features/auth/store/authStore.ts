// src/features/auth/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** 유저 프로필(필요 시 필드 추가) */
export interface Profile {
  nickname: string;
  email?: string;
}

/** 인증 상태 + 조작 메서드 */
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  profile: Profile | null;

  /** 로그인/재발급 시 토큰(과 프로필)을 한 번에 갱신 */
  setTokens: (
    access: string | null | undefined,
    refresh: string | null | undefined,
    profile?: Profile | null
  ) => void;

  /** 프로필만 갱신 */
  setProfile: (p: Profile | null) => void;

  /** 액세스 토큰만 갱신 (인터셉터에서 /auth/reissue 성공 시 호출) */
  updateAccessToken: (access: string | null | undefined) => void;

  /** 전체 초기화(로그아웃) */
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      profile: null,

      setTokens: (access, refresh, profile = null) =>
        set((s) => ({
          accessToken: access ?? null, // undefined 방지
          refreshToken: refresh ?? null,
          profile: profile ?? s.profile, // 프로필 미전달 시 기존 유지
        })),

      setProfile: (p) => set({ profile: p }),

      updateAccessToken: (access) => set({ accessToken: access ?? null }), // 재발급 시 한 줄 갱신

      clear: () =>
        set({ accessToken: null, refreshToken: null, profile: null }),
    }),
    {
      name: "auth", // localStorage key
      storage: createJSONStorage(() => localStorage), // ↔ 세션 유지만 원하면 sessionStorage
      // 저장 최소화: 꼭 필요한 키만 저장 (리렌더/깜빡임 완화)
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        profile: s.profile,
      }),
      // 필요 시 버전/마이그레이션 사용
      // version: 1,
      // migrate: (persisted, version) => persisted,
    }
  )
);

// ---- 선택: 편리한 셀렉터 훅 (필요하면 사용) ----
// export const useAccessToken = () => useAuthStore((s) => s.accessToken);
// export const useProfile = () => useAuthStore((s) => s.profile);
