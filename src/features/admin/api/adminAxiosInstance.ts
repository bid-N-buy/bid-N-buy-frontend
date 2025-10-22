import axios, { AxiosError, AxiosHeaders } from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { useAdminAuthStore } from "../store/adminStore";

const API_BASE = import.meta.env.VITE_BACKEND_ADDRESS as string;

const adminApi: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 10000,
});

const getPath = (url: string) => {
  try {
    return new URL(url, API_BASE).pathname;
  } catch {
    return url;
  }
};

// 필요 엔드포인트
const ADMIN_AUTH_PATHS = [
  "/admin/auth/login",
  "/admin/auth/signup",
  "/admin/auth/reissue",
];

const isAdminAuthEndpoint = (url: string) => {
  const p = getPath(url);
  return ADMIN_AUTH_PATHS.some((prefix) => p.startsWith(prefix));
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

// 요청 인터셉터
adminApi.interceptors.request.use((config) => {
  const url = config.url ?? "";
  const sameOrigin =
    url.startsWith("/") || (API_BASE && url.startsWith(API_BASE));

  // 토큰 자동 부착
  if (sameOrigin && !isAdminAuthEndpoint(url)) {
    const { accessToken } = useAdminAuthStore.getState();
    if (accessToken) {
      const headers = ensureAxiosHeaders(config);
      const hasBearer = String(headers.get("Authorization") || "").startsWith(
        "Bearer "
      );
      if (!hasBearer) headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  if (import.meta.env.DEV) {
    console.debug("[adminApi:req]", config.method, config.url, {
      hasAdminAuth: !!useAdminAuthStore.getState().accessToken,
    });
  }
  return config;
});

// 401 재발급 큐
let isRefreshing = false;
let waitQueue: Array<(t: string | null) => void> = [];
const flush = (t: string | null) => {
  waitQueue.forEach((r) => r(t));
  waitQueue = [];
};

// 관리자 재발급 url
const ADMIN_REISSUE_URL = `${API_BASE}/admin/auth/reissue`;

// 응답 인터셉터
adminApi.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const { response, config } = error;
    if (!response || !config) return Promise.reject(error);

    if (response.status !== 401) return Promise.reject(error);

    const url = config.url ?? "";

    // 관리자 인증 엔드포인트에서 401 -> 세션 정리
    if (isAdminAuthEndpoint(url)) {
      useAdminAuthStore.getState().clear();
      return Promise.reject(error);
    }

    const original = config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (original._retry) {
      useAdminAuthStore.getState().clear();
      return Promise.reject(error);
    }
    original._retry = true;

    // 재발급 진행 중이면 큐 대기
    if (isRefreshing) {
      const token = await new Promise<string | null>((resolve) =>
        waitQueue.push(resolve)
      );
      if (!token) return Promise.reject(error);
      const headers = ensureAxiosHeaders(original);
      headers.set("Authorization", `Bearer ${token}`);
      return adminApi(original);
    }

    // 재발급 시작
    isRefreshing = true;
    try {
      const { accessToken, refreshToken, setTokens, clear } =
        useAdminAuthStore.getState();

      // 둘 다 필요 - 하나라도 없으면 실패 처리
      if (!accessToken || !refreshToken) {
        if (import.meta.env.DEV) {
          console.warn("[admin reissue] missing token(s)", {
            hasAccess: !!accessToken,
            hasRefresh: !!refreshToken,
          });
        }
        clear();
        flush(null);
        return Promise.reject(error);
      }

      // 서버 스펙: 소문자 키(회원쪽과 동일 규약이면 그대로)
      const body = {
        accesstoken: accessToken,
        refreshtoken: refreshToken,
      };

      // 인터셉터 재귀 방지 위해 axios 기본 인스턴스 사용
      const refreshRes = await axios.post<ReissueResponse>(
        ADMIN_REISSUE_URL,
        body,
        {
          withCredentials: false,
        }
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

      // 원요청 재시도
      const headers2 = ensureAxiosHeaders(original);
      headers2.set("Authorization", `Bearer ${newAccess}`);
      return adminApi(original);
    } catch (e) {
      useAdminAuthStore.getState().clear();
      flush(null);
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default adminApi;
