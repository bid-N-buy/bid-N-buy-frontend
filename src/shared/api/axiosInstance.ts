// src/shared/api/axiosInstance.ts
import axios, { AxiosError, AxiosHeaders } from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";
import type { ReissueRequest } from "../types/auth";

export const API_BASE = import.meta.env.VITE_BACKEND_ADDRESS as string;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10000,
});

/* ------------------ 유틸 ------------------ */
const getPath = (url: string) => {
  try {
    return new URL(url, API_BASE).pathname;
  } catch {
    return url;
  }
};

// 인증 관련 경로엔 Authorization 헤더를 붙이지 않음
const isAuthEndpoint = (url: string) => {
  const p = getPath(url);
  return (
    p.startsWith("/auth/signup") ||
    p.startsWith("/auth/login") ||
    p.startsWith("/auth/reissue") ||
    p.startsWith("/auth/kakao") ||
    p.startsWith("/auth/naver") ||
    p.startsWith("/oauth/callback")
  );
};

// 헤더를 항상 AxiosHeaders 인스턴스로 보장
const ensureAxiosHeaders = (cfg: InternalAxiosRequestConfig): AxiosHeaders => {
  if (!cfg.headers || typeof (cfg.headers as any).set !== "function") {
    cfg.headers = new AxiosHeaders(cfg.headers as any);
  }
  return cfg.headers as AxiosHeaders;
};

// tokenInfo / legacy 응답 모두 지원
interface TokenResult {
  access: string | null;
  refresh: string | null;
}
const pickTokens = (p: Record<string, any> | undefined): TokenResult => {
  if (!p) return { access: null, refresh: null };
  if (p.tokenInfo) {
    return {
      access: p.tokenInfo.accessToken ?? null,
      refresh: p.tokenInfo.refreshToken ?? null,
    };
  }
  return {
    access: p.accessToken ?? null,
    refresh: p.refreshToken ?? null,
  };
};

/* ------------------ 요청 인터셉터 ------------------ */
api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  const sameOrigin =
    url.startsWith("/") || (API_BASE && url.startsWith(API_BASE));

  if (sameOrigin && !isAuthEndpoint(url)) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      const headers = ensureAxiosHeaders(config);
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  if (import.meta.env.DEV) {
    console.debug("[api:req]", config.method, config.url, {
      hasAuth: !!useAuthStore.getState().accessToken,
    });
  }
  return config;
});

/* ------------------ 401 재발급 큐 ------------------ */
let isRefreshing = false;
let waitQueue: Array<(t: string | null) => void> = [];
const flush = (t: string | null) => {
  waitQueue.forEach((r) => r(t));
  waitQueue = [];
};

/* ------------------ 응답 인터셉터 ------------------ */
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const { response, config } = error;
    if (!response || !config) throw error;

    if (response.status !== 401) throw error;

    const url = config.url ?? "";
    if (isAuthEndpoint(url)) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }

    const original = config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (original._retry) {
      useAuthStore.getState().clear();
      throw error;
    }
    original._retry = true;

    // 이미 재발급 중이면 대기열에 등록
    if (isRefreshing) {
      const token = await new Promise<string | null>((r) => waitQueue.push(r));
      if (token) {
        const headers = ensureAxiosHeaders(original);
        headers.set("Authorization", `Bearer ${token}`);
      }
      return api(original);
    }

    // 재발급 시작
    isRefreshing = true;
    try {
      const { refreshToken, setTokens, clear } = useAuthStore.getState();

      if (!refreshToken) {
        clear();
        flush(null);
        throw error;
      }

      const body: ReissueRequest = { refreshToken };

      // 주의: 인터셉터 루프 방지를 위해 기본 axios로 호출
      const refreshRes = await axios.post(`${API_BASE}/auth/reissue`, body, {
        withCredentials: true,
      });

      const { access: newAccess, refresh: newRefresh } = pickTokens(
        refreshRes.data as Record<string, any>
      );

      if (!newAccess) {
        clear();
        flush(null);
        throw error;
      }

      // 스토어 갱신 및 대기열 해소
      setTokens(newAccess, newRefresh ?? null);
      flush(newAccess);

      // 원요청 재시도
      const headers2 = ensureAxiosHeaders(original);
      headers2.set("Authorization", `Bearer ${newAccess}`);
      return api(original);
    } catch (e) {
      useAuthStore.getState().clear();
      flush(null);
      throw e;
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
