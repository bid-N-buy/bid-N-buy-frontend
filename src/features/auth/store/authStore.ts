// src/features/auth/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** 서버 스키마 기준 숫자 id를 가정(문자열이면 string으로 바꿔도 됨) */
export type UserId = number;

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
  userId: UserId | null;

  /** 로그인/재발급 시 토큰(과 프로필, userId)을 한 번에 갱신 */
  setTokens: (
    access: string | null | undefined,
    refresh: string | null | undefined,
    profile?: Profile | null,
    userId?: UserId | null
  ) => void;

  /** 프로필만 갱신 */
  setProfile: (p: Profile | null) => void;

  /** userId만 갱신(예: /users/me 이후) */
  setUserId: (id: UserId | null) => void;

  /** 액세스 토큰만 갱신 (인터셉터에서 /auth/reissue 성공 시 호출) */
  updateAccessToken: (access: string | null | undefined) => void;

  /** 전체 초기화(로그아웃) */
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
          accessToken: access ?? null, // undefined 방지
          refreshToken: refresh ?? null,
          profile: profile ?? s.profile, // 프로필 미전달 시 기존 유지
          userId: typeof userId === "undefined" ? s.userId : (userId ?? null), // 명시 전달 시에만 변경
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
      name: "auth", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // 저장 최소화: 꼭 필요한 키만 저장
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        profile: s.profile,
        userId: s.userId, // ✅ userId를 반드시 persist
      }),
      // version: 2,
      // migrate: (persisted, version) => persisted,
    }
  )
);

// ---- 선택: 편리한 셀렉터 훅 (필요하면 사용) ----
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
export const useProfile = () => useAuthStore((s) => s.profile);
export const useUserId = () => useAuthStore((s) => s.userId);
