// src/shared/api/axiosInstance.ts
import axios, { AxiosError, AxiosHeaders } from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";

export const API_BASE = import.meta.env.VITE_BACKEND_ADDRESS as string;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // ✅ Bearer 모드
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

const ensureAxiosHeaders = (cfg: InternalAxiosRequestConfig): AxiosHeaders => {
  if (!cfg.headers || typeof (cfg.headers as any).set !== "function") {
    cfg.headers = new AxiosHeaders(cfg.headers as any);
  }
  return cfg.headers as AxiosHeaders;
};

// 서버 응답 예시
type ReissueResponse = {
  email?: string;
  nickname?: string;
  tokenInfo?: {
    accessToken?: string;
    refreshToken?: string;
    grantType?: string;
    accessTokenExpiresIn?: number;
  };
};

/* ------------------ 요청 인터셉터 ------------------ */
api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  const sameOrigin =
    url.startsWith("/") || (API_BASE && url.startsWith(API_BASE));

  // ✅ Bearer 토큰 자동 부착 (인증 엔드포인트 제외)
  if (sameOrigin && !isAuthEndpoint(url)) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      const headers = ensureAxiosHeaders(config);
      const hasBearer = String(headers.get("Authorization") || "").startsWith(
        "Bearer "
      );
      if (!hasBearer) headers.set("Authorization", `Bearer ${accessToken}`);
    }
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
    if (!response || !config) return Promise.reject(error);

    // 401 아니면 바로 리턴
    if (response.status !== 401) return Promise.reject(error);

    const url = config.url ?? "";

    // 인증 엔드포인트에서 401 → 세션 정리 후 상위로
    if (isAuthEndpoint(url)) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }

    const original = config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (original._retry) {
      // 이미 재시도 했는데 또 401 → 세션 클리어
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }
    original._retry = true;

    // 이미 재발급 진행 중이면 큐 대기
    if (isRefreshing) {
      const token = await new Promise<string | null>((resolve) =>
        waitQueue.push(resolve)
      );
      if (!token) return Promise.reject(error);
      const headers = ensureAxiosHeaders(original);
      headers.set("Authorization", `Bearer ${token}`);
      return api(original);
    }

    // 재발급 시작
    isRefreshing = true;
    try {
      const { accessToken, refreshToken, setTokens, clear } =
        useAuthStore.getState();

      // 🔒 서버 스펙상 둘 다 필요 → 하나라도 없으면 재발급 불가
      if (!accessToken || !refreshToken) {
        clear();
        flush(null);
        return Promise.reject(error);
      }

      // ✅ 서버 스펙: 소문자 키!
      const body = {
        accessToken: accessToken,
        refreshToken: refreshToken,
      };

      // 인터셉터 재귀 방지 위해 axios 기본 인스턴스 사용
      const refreshRes = await axios.post<ReissueResponse>(
        `${API_BASE}/auth/reissue`,
        body,
        { withCredentials: false }
      );

      const info = refreshRes.data?.tokenInfo;
      const newAccess = info?.accessToken ?? null;
      const newRefresh = info?.refreshToken ?? null;

      if (!newAccess) {
        clear();
        flush(null);
        return Promise.reject(error);
      }

      // 스토어 갱신 & 대기열 해소
      setTokens(newAccess, newRefresh ?? refreshToken);
      flush(newAccess);

      // 원요청 재시도 (새 토큰 부착)
      const headers2 = ensureAxiosHeaders(original);
      headers2.set("Authorization", `Bearer ${newAccess}`);
      return api(original);
    } catch (e) {
      useAuthStore.getState().clear();
      flush(null);
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
