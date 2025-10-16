// src/features/auth/components/LoginForm.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import api, { API_BASE } from "../../../../shared/api/axiosInstance";
import { useAuthStore, type AuthState } from "../../store/authStore";
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

/** (디버그) 간단 JWT payload 디코더 — 검증 X(표시/라우팅 캐시용) */
const decodeJwt = (jwt?: string | null) => {
  if (!jwt) return null;
  try {
    const [, payload] = jwt.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

/** 응답/토큰에서 userId 추출: 1) 응답.userId 2) JWT(sub/uid) */
const resolveUserIdFrom = (
  data: any,
  accessToken: string | null
): number | null => {
  if (typeof data?.userId === "number") return data.userId;
  const claims = decodeJwt(accessToken);
  // 서버가 sub를 숫자로 주거나, uid 클레임을 쓰는 경우 지원
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

/** 간단 이메일 형식 체크(프론트 보조용) */
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // zustand
  const setTokens = useAuthStore((s: AuthState) => s.setTokens);

  const navigate = useNavigate();
  const location = useLocation();

  /** (DEV) 스토어 변경 구독 로그 */
  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prev) => {
      if (import.meta.env.DEV) {
        console.debug("[auth] changed", {
          accessChanged: state.accessToken !== prev.accessToken,
          refreshChanged: state.refreshToken !== prev.refreshToken,
          profileChanged: state.profile !== prev.profile,
          userId: state.userId,
        });
      }
    });
    return unsub;
  }, []);

  /** (?token=..., ?error=...) 소셜 콜백 대응 */
  useEffect(() => {
    const url = new URL(window.location.href);
    const err = url.searchParams.get("error");
    const errDesc = url.searchParams.get("error_description");
    if (err) {
      setError(errDesc || "소셜 로그인에 실패했습니다.");
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState({}, "", url.pathname + url.search);
      return;
    }

    const token = url.searchParams.get("token");
    if (token) {
      // accessToken만 전달되는 플로우
      setTokens(token, null);
      if (import.meta.env.DEV) {
        const snap = useAuthStore.getState();
        console.debug("[auth] after social token", {
          accessToken: !!snap.accessToken,
          refreshToken: !!snap.refreshToken,
          profile: snap.profile,
          userId: snap.userId,
          claims: decodeJwt(token),
        });
      }
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search);
      navigate("/");
    }
  }, [navigate, setTokens]);

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
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true, // 쿠키 기반이면 유지
          }
        );

        if (import.meta.env.DEV) {
          console.debug("[login] axios response", {
            status: res.status,
            headers: res.headers,
            data: res.data,
          });
        }

        const data = res.data;

        // 1) 토큰 파싱 (신/구 응답 모두 지원)
        const access = hasTokenInfo(data)
          ? (data.tokenInfo?.accessToken ?? null)
          : (data.accessToken ?? null);

        const refresh = hasTokenInfo(data)
          ? (data.tokenInfo?.refreshToken ?? null)
          : (data.refreshToken ?? null);

        if (!access) {
          throw new Error(
            "accessToken이 응답에 없습니다. 서버 응답 형식을 확인하세요."
          );
        }

        // 2) 프로필 + userId 파싱
        const parsedProfile = {
          nickname: (data as any).nickname ?? undefined,
          email: (data as any).email ?? undefined,
        };
        const hasAnyProfile =
          typeof parsedProfile.nickname !== "undefined" ||
          typeof parsedProfile.email !== "undefined";

        // ✅ /users/me가 없으므로, 응답에 없으면 JWT 클레임에서 보강
        const userId = resolveUserIdFrom(data, access);

        // 3) 저장 (프로필 없으면 기존 유지 위해 undefined 전달)
        setTokens(
          access,
          refresh ?? null,
          hasAnyProfile ? parsedProfile : undefined,
          userId
        );

        if (import.meta.env.DEV) {
          const snap = useAuthStore.getState();
          console.debug("[auth] after login (store)", {
            accessToken: !!snap.accessToken,
            refreshToken: !!snap.refreshToken,
            profile: snap.profile,
            userId: snap.userId,
          });
        }

        // 로그인 성공 후 이동 (원래 가려던 곳이 있으면 복귀)
        const to =
          (location.state as any)?.from?.pathname ??
          (location.state as any)?.redirect ??
          "/";
        navigate(to, { replace: true });
      } catch (err) {
        if (axios.isAxiosError<ErrorResponse>(err)) {
          const msg =
            err.response?.data?.message ??
            (err.response?.status === 401
              ? "아이디 또는 비밀번호가 올바르지 않습니다."
              : "로그인에 실패했습니다.");
          setError(msg);

          if (import.meta.env.DEV) {
            console.error("[login] failed", {
              url: err.config?.url,
              method: err.config?.method,
              status: err.response?.status,
              data: err.response?.data,
            });
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, loading, location.state, navigate, setTokens]
  );

  /** 카카오/네이버 시작 */
  const startKakao = useCallback(() => {
    if (loading) return;
    window.location.assign(
      "https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=3ca9c59cb383f463525c62ffb4615195&redirect_uri=http://localhost:8080/auth/kakao"
    );
  }, [loading]);

  const startNaver = useCallback(() => {
    if (loading) return;
    const redirectParam = encodeURIComponent(
      location.pathname + location.search || "/"
    );
    window.location.assign(
      `${API_BASE}/auth/naver/loginstart?redirect=${redirectParam}`
    );
  }, [loading, location.pathname, location.search]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 이메일 */}
      <input
        name="email"
        type="email"
        id="email"
        placeholder="이메일을 입력해 주세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="hover:border-purple w-full rounded-md border px-3 py-2"
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
        className="hover:border-purple w-full rounded-md border px-3 py-2"
        disabled={loading}
        autoComplete="current-password"
        required
        minLength={4}
      />

      {/* 로그인 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="bg-purple w-full rounded-md py-2 text-white disabled:opacity-60"
        aria-busy={loading}
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {/* (DEV) 상태 미니 표시 */}
      {/* {import.meta.env.DEV && (
        <p className="text-[11px] text-gray-500">
          uid: {String(useAuthStore.getState().userId)} / nick:{" "}
          {useAuthStore.getState().profile?.nickname ?? "-"}
        </p>
      )} */}

      {/* 링크 */}
      <div className="mt-[10px] flex justify-center gap-3 text-sm">
        <Link to="/resetPassword" className="text-h9 hover:underline">
          비밀번호 찾기
        </Link>
        <span className="text-h9">|</span>
        <Link to="/signup" className="text-h9 hover:underline">
          회원가입
        </Link>
      </div>

      {/* 소셜 로그인 */}
      <div className="mt-4 space-y-3">
        {/* 네이버 */}
        <button
          type="button"
          onClick={startNaver}
          disabled={loading}
          aria-label="네이버 로그인"
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#03C75A] text-white transition hover:brightness-105 focus:ring-2 focus:ring-[#03C75A]/40 focus:outline-none active:brightness-95 disabled:opacity-60"
        >
          <span className="grid h-6 w-6 place-items-center rounded-[4px] bg-white font-black text-[#03C75A]">
            N
          </span>
          <span className="text-[15px] font-semibold">네이버로 로그인</span>
        </button>

        {/* 카카오 */}
        <button
          type="button"
          onClick={startKakao}
          disabled={loading}
          aria-label="카카오 로그인"
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] text-black transition hover:brightness-105 focus:ring-2 focus:ring-[#FEE500]/40 focus:outline-none active:brightness-95 disabled:opacity-60"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-[13px] font-bold text-[#FEE500]">
            K
          </span>
          <span className="text-[15px] font-semibold">카카오로 로그인</span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
