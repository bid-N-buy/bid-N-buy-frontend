import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import api, { API_BASE } from "../../../../shared/api/axiosInstance";
import { useAuthStore, type AuthState } from "../../store/authStore";
import useToast from "../../../../shared/hooks/useToast";
import Toast from "../../../../shared/components/Toast";
import type {
  LoginResponse,
  ErrorResponse,
} from "../../../../shared/types/CommonType";

/** 구형 응답 호환 (토큰이 top-level) */
type LegacyLoginResponse = {
  accessToken?: string | null;
  refreshToken?: string | null;
  email?: string;
  nickname?: string;
  userId?: number;
};

function hasTokenInfo(
  d: LoginResponse | LegacyLoginResponse
): d is LoginResponse {
  return typeof (d as LoginResponse).tokenInfo !== "undefined";
}

/** (디버그) 간단 JWT payload 디코더 — 검증 X */
const decodeJwt = (jwt?: string | null) => {
  if (!jwt) return null;
  try {
    const [, payload] = jwt.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

/** 응답/토큰에서 userId 추출 */
const resolveUserIdFrom = (
  data: any,
  accessToken: string | null
): number | null => {
  if (typeof data?.userId === "number") return data.userId;
  const claims = decodeJwt(accessToken);
  const sub = claims?.sub;
  const uid = claims?.uid ?? claims?.userId;
  const parsed =
    typeof sub === "number"
      ? sub
      : typeof sub === "string" && /^\d+$/.test(sub)
        ? Number(sub)
        : typeof uid === "number"
          ? uid
          : typeof uid === "string" && /^\d+$/.test(uid)
            ? Number(uid)
            : null;
  return parsed ?? null;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("dinosaur7656@gmail.com");
  const [password, setPassword] = useState("abcd1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTokens = useAuthStore((s: AuthState) => s.setTokens);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { toast, showToast, hideToast } = useToast();
  const toastShownRef = useRef<string | null>(null);

  // ✅ 반복 사용 클래스 (반응형 사이즈 포함)
  const inputClass =
    "h-12 sm:h-[52px] md:h-[56px] w-full rounded-md border px-3 sm:px-3.5 " +
    "outline-none focus:border-2 hover:border-purple focus:border-purple " +
    "text-[14px] sm:text-[15px]";
  const btnClass =
    "h-12 sm:h-[52px] md:h-[56px] w-full rounded-md text-white transition " +
    "bg-purple hover:bg-deep-purple disabled:opacity-60 text-[15px] sm:text-[16px] font-semibold";

  // 토스트 표시 (중복 방지)
  useEffect(() => {
    const state = location.state as {
      toast?: { message: string; type: "success" | "error" };
      returnTo?: string;
    } | null;
    if (state?.toast) {
      const toastKey = `${location.pathname}-${location.key || "default"}-${state.toast.message}`;
      if (toastShownRef.current !== toastKey) {
        toastShownRef.current = toastKey;
        showToast(state.toast.message, state.toast.type);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.key, location.state]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (loading) return;

      setError(null);

      const emailTrim = email.trim();
      const pwTrim = password.trim();

      if (!emailTrim || !pwTrim) {
        setError("아이디와 비밀번호를 입력해 주세요.");
        return;
      }
      if (!isEmail(emailTrim)) {
        setError("올바른 이메일 형식이 아닙니다.");
        return;
      }
      if (pwTrim.length < 4) {
        setError("비밀번호가 너무 짧습니다.");
        return;
      }

      try {
        setLoading(true);

        const res = await api.post<LoginResponse | LegacyLoginResponse>(
          "/auth/login",
          { email: emailTrim, password: pwTrim },
          { headers: { "Content-Type": "application/json" } }
        );

        const data = res.data;

        const access = hasTokenInfo(data)
          ? (data.tokenInfo?.accessToken ?? null)
          : ((data as LegacyLoginResponse).accessToken ?? null);

        const refresh = hasTokenInfo(data)
          ? (data.tokenInfo?.refreshToken ?? null)
          : ((data as LegacyLoginResponse).refreshToken ?? null);

        if (!access) {
          throw new Error(
            "accessToken이 응답에 없습니다. 서버 응답 형식을 확인하세요."
          );
        }

        const parsedProfile = {
          nickname: (data as any).nickname ?? undefined,
          email: (data as any).email ?? undefined,
        };
        const hasAnyProfile =
          typeof parsedProfile.nickname !== "undefined" ||
          typeof parsedProfile.email !== "undefined";

        const userId = resolveUserIdFrom(data, access);

        setTokens(
          access,
          refresh ?? null,
          hasAnyProfile ? parsedProfile : undefined,
          userId
        );

        // 리다이렉트
        const returnToFromQuery = searchParams.get("returnTo");
        const state = location.state as {
          from?: { pathname?: string };
          redirect?: string;
          returnTo?: string;
        } | null;

        const to = returnToFromQuery
          ? decodeURIComponent(returnToFromQuery)
          : state?.returnTo
            ? decodeURIComponent(state.returnTo)
            : (state?.from?.pathname ?? state?.redirect ?? "/");

        navigate(to, { replace: true });
      } catch (err) {
        if (axios.isAxiosError<ErrorResponse>(err)) {
          const msg =
            err.response?.data?.message ??
            (err.response?.status === 401
              ? "아이디 또는 비밀번호가 올바르지 않습니다."
              : "로그인에 실패했습니다.");
          setError(msg);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [
      email,
      password,
      loading,
      location.state,
      searchParams,
      navigate,
      setTokens,
    ]
  );

  /** 소셜 로그인 */
  const startKakao = useCallback(() => {
    if (loading) return;
    window.location.assign(`${API_BASE}/auth/kakao/loginstart`);
  }, [loading]);

  const startNaver = useCallback(() => {
    if (loading) return;
    window.location.assign(`${API_BASE}/auth/naver/loginstart`);
  }, [loading]);

  return (
    <>
      {/* ✅ 폼 래퍼: 폭을 뷰포트에 따라 점진적으로 넓힘 */}
      <div className="mx-auto w-full max-w-[360px] px-4 py-8 sm:max-w-[420px] sm:px-0 sm:py-10 md:max-w-[480px] md:py-12 lg:max-w-[520px]">
        <form onSubmit={handleSubmit} className="w-full space-y-3 sm:space-y-4">
          {/* 이메일 */}
          <input
            name="email"
            type="email"
            id="email"
            placeholder="이메일을 입력해 주세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            disabled={loading}
            autoComplete="email"
            required
          />

          {/* 비밀번호 */}
          <input
            name="password"
            type="password"
            id="password"
            placeholder="비밀번호를 입력해 주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            disabled={loading}
            autoComplete="current-password"
            required
            minLength={4}
          />

          {/* 로그인 버튼 */}
          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? "로그인 중..." : "로그인"}
          </button>

          {/* 에러 메시지 */}
          {error && (
            <p
              className="text-[13px] text-red-500 sm:text-sm"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          {/* 링크 */}
          <div className="mt-[8px] flex justify-center gap-3 text-[13px] sm:mt-[10px] sm:text-sm">
            <Link to="/resetPassword" className="hover:underline">
              비밀번호 찾기
            </Link>
            <span className="opacity-50">|</span>
            <Link to="/signup" className="hover:underline">
              회원가입
            </Link>
          </div>

          {/* 소셜 로그인 */}
          <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
            {/* 네이버 */}
            <button
              type="button"
              onClick={startNaver}
              disabled={loading}
              aria-label="네이버 로그인"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#03C75A] text-white transition hover:brightness-105 focus:ring-2 focus:ring-[#03C75A]/40 focus:outline-none active:brightness-95 disabled:opacity-60 sm:h-[52px] md:h-[56px]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-[4px] bg-white font-black text-[#03C75A]">
                N
              </span>
              <span className="text-[14px] font-semibold sm:text-[15px]">
                네이버로 로그인
              </span>
            </button>

            {/* 카카오 */}
            <button
              type="button"
              onClick={startKakao}
              disabled={loading}
              aria-label="카카오 로그인"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] text-black transition hover:brightness-105 focus:ring-2 focus:ring-[#FEE500]/40 focus:outline-none active:brightness-95 disabled:opacity-60 sm:h-[52px] md:h-[56px]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-[13px] font-bold text-[#FEE500]">
                K
              </span>
              <span className="text-[14px] font-semibold sm:text-[15px]">
                카카오로 로그인
              </span>
            </button>
          </div>
        </form>
      </div>

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default LoginForm;
