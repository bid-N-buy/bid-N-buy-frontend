import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestHeaders,
} from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";
import type {
  ReissueRequest,
  ReissueResponse,
  LoginResponse,
} from "../types/auth";

export const API_BASE = import.meta.env.VITE_BACKEND_ADDRESS;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10000,
});

// 경로 매칭
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
    p.startsWith("/auth/reissue")
  );
};

// 요청 인터셉터
api.interceptors.request.use((config) => {
  const url = config.url ?? "";

  const isSameOrigin =
    url.startsWith("/") || (API_BASE && url.startsWith(API_BASE));

  if (isSameOrigin && !isAuthEndpoint(url)) {
    const { accessToken } = useAuthStore.getState();
    // if (accessToken) {
    //   const h = (config.headers ?? {}) as AxiosRequestHeaders;
    //   h.Authorization = `Bearer ${accessToken}`;
    //   config.headers = h;
    // }
    if (accessToken) {
      // 수정) config.headers.set() 메서드 사용
      config.headers.set("Authorization", `Bearer ${accessToken}`);
      // const h = (config.headers ?? {}) as AxiosRequestHeaders;
      // h.Authorization = `Bearer ${accessToken}`;
      // config.headers = h;
    }
  }
  return config;
});

// refresh token 큐 관리 변수
let isRefreshing = false;
let waitQueue: Array<(t: string | null) => void> = [];
const flush = (t: string | null) => {
  waitQueue.forEach((r) => r(t));
  waitQueue = [];
};

// 재발급 응답 파싱 로직 함수화
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

    if (isRefreshing) {
      const token = await new Promise<string | null>((r) => waitQueue.push(r));
      if (token) {
        const h = (original.headers ?? {}) as AxiosRequestHeaders;
        h.Authorization = `Bearer ${token}`;
        original.headers = h;
      }
      return api(original);
    }

    isRefreshing = true;
    try {
      const { refreshToken, setTokens, clear } = useAuthStore.getState();

      // refreshToken 부재 시 갱신 시도 차단
      if (!refreshToken) {
        clear();
        flush(null);
        throw error;
      }

      const body: ReissueRequest = { refreshToken };

      const refreshRes = await axios.post<unknown>(
        `${API_BASE}/auth/reissue`,
        body,
        { withCredentials: true }
      );

      const { access: newAccess, refresh: newRefresh } = pickTokens(
        refreshRes.data as Record<string, any>
      );

      if (!newAccess) {
        clear();
        flush(null);
        throw error;
      }

      setTokens(newAccess, newRefresh ?? null);
      flush(newAccess);

      const h2 = (original.headers ?? {}) as AxiosRequestHeaders;
      h2.Authorization = `Bearer ${newAccess}`;
      original.headers = h2;

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
