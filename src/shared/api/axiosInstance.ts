import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
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

const isAuthEndpoint = (url: string) =>
  url.includes("/auth/reissue") ||
  url.includes("/auth/login") ||
  url.includes("/auth/signup");

// 요청: /auth/* 에는 Authorization 붙이지 않기
api.interceptors.request.use((config) => {
  const url = config.url ?? "";
  if (!isAuthEndpoint(url)) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

let isRefreshing = false;
let waitQueue: Array<(t: string | null) => void> = [];
const flush = (t: string | null) => {
  waitQueue.forEach((r) => r(t));
  waitQueue = [];
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
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
      }
      return api(original);
    }

    isRefreshing = true;
    try {
      const { refreshToken, setTokens, clear } = useAuthStore.getState();

      // ✅ 서버는 refreshToken만 필요
      const body: ReissueRequest | undefined = refreshToken
        ? { refreshToken }
        : undefined;

      const refreshRes = await axios.post<
        | ReissueResponse
        | LoginResponse
        | { accessToken?: string; refreshToken?: string }
      >(`${API_BASE}/auth/reissue`, body ?? {}, { withCredentials: true });

      const payload = refreshRes.data;
      const newAccess =
        "tokenInfo" in (payload as object)
          ? (payload as ReissueResponse | LoginResponse).tokenInfo.accessToken
          : ((payload as { accessToken?: string }).accessToken ?? null);

      const newRefresh =
        "tokenInfo" in (payload as object)
          ? ((payload as ReissueResponse | LoginResponse).tokenInfo
              .refreshToken ?? null)
          : ((payload as { refreshToken?: string }).refreshToken ?? null);

      if (!newAccess) {
        clear();
        flush(null);
        throw error;
      }

      setTokens(newAccess, newRefresh ?? null);
      flush(newAccess);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newAccess}`;
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
