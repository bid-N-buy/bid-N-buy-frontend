// shared/api/axiosInstance.ts
import axios, { AxiosError } from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { useAuthStore } from "../../features/auth/store/authStore";
import type {
  ErrorResponse,
  ReissueRequest,
  ReissueResponse,
  LoginResponse,
} from "../types/CommonType";

/** 환경별 API 베이스 URL */
// export const API_BASE = import.meta.env.PROD
//   ? import.meta.env.VITE_BACKEND_ADDRESS
//   : "http://localhost:8080";

// 프록시 설정용
export const API_BASE = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_ADDRESS
  : "/api";

/** 공용 axios 인스턴스 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // 필요 없더라도 유지해도 무방
  timeout: 10_000,
});

/** tokenInfo가 있는 최신 스펙인지 확인 */
function hasTokenInfo(
  d:
    | LoginResponse
    | ReissueResponse
    | { accessToken?: string; refreshToken?: string }
): d is LoginResponse | ReissueResponse {
  return typeof (d as LoginResponse).tokenInfo !== "undefined";
}

/** 요청 인터셉터: Authorization 주입 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** 동시 갱신 방지용 락 & 대기열 */
let isRefreshing = false;
let waitQueue: Array<(t: string | null) => void> = [];
const flush = (t: string | null) => {
  waitQueue.forEach((r) => r(t));
  waitQueue = [];
};

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError<ErrorResponse>) => {
    const { response, config } = error;
    if (!response || !config) throw error;
    if (response.status !== 401) throw error;

    const original = config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (original._retry) {
      // 이미 재시도 했는데 또 401 → 로그아웃 처리
      useAuthStore.getState().clear();
      throw error;
    }
    original._retry = true;

    // 다른 요청이 refresh 중이면 대기
    if (isRefreshing) {
      const newToken = await new Promise<string | null>((resolve) =>
        waitQueue.push(resolve)
      );
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(original);
    }

    isRefreshing = true;
    try {
      const { accessToken, refreshToken, setTokens, clear } =
        useAuthStore.getState();

      // ① 쿠키 기반 서버: 본문 없이 호출
      // ② 본문(JSON) 기반 서버: accesstoken / refreshtoken 함께 전달
      let body: ReissueRequest | undefined;
      if (refreshToken) {
        body = {
          accesstoken: accessToken ?? "",
          refreshtoken: refreshToken,
        };
      }

      const refreshRes = await axios.post<
        | ReissueResponse
        | LoginResponse
        | { accessToken?: string; refreshToken?: string }
      >(`${API_BASE}/auth/reissue`, body ?? {}, { withCredentials: true });

      // 응답 파싱 (tokenInfo 혹은 top-level)
      const payload = refreshRes.data;
      const newAccess = hasTokenInfo(payload)
        ? payload.tokenInfo.accessToken
        : (payload.accessToken ?? null);
      const newRefresh = hasTokenInfo(payload)
        ? (payload.tokenInfo.refreshToken ?? null)
        : (payload.refreshToken ?? null);

      if (!newAccess) {
        clear();
        flush(null);
        throw error;
      }

      setTokens(newAccess, newRefresh); // refresh가 쿠키 기반이면 null일 수 있음
      flush(newAccess);

      // 원 요청 재시도
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
