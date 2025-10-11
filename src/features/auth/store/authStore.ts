import { create } from "zustand";

/**
 * 인증 상태 타입 정의
 * - accessToken / refreshToken: 현재 메모리에 저장된 JWT 토큰
 * - setTokens: 로그인 또는 재발급 시 토큰 갱신
 * - clear: 로그아웃 시 모든 토큰 제거
 */
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string | null, refresh: string | null) => void;
  clear: () => void;
}

/**
 * Zustand 전역 스토어 (React 전역 상태 관리)
 * - 메모리 기반이라 새로고침 시 초기화됨
 * - 쿠키 기반 refresh 로직과 함께 쓰면 안전
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,

  setTokens: (access, refresh) => {
    set({
      accessToken: access,
      refreshToken: refresh,
    });
  },

  clear: () => {
    set({
      accessToken: null,
      refreshToken: null,
    });
  },
}));
