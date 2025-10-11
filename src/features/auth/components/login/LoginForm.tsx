import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import api, { API_BASE } from "../../../../shared/api/axiosInstance";
import { useAuthStore, type AuthState } from "../../store/authStore";
import type {
  LoginResponse,
  ErrorResponse,
} from "../../../../shared/types/CommonType";

import kakaoBg from "../../../../assets/img/kakao_login.png";
import naverBg from "../../../../assets/img/naver_login.png";

// 서버가 top-level 로 토큰을 주는 경우까지 커버
type LegacyLoginResponse = {
  accessToken?: string | null;
  refreshToken?: string | null;
  // 서버에 따라 expiresIn 등이 있을 수 있음
};

function hasTokenInfo(
  d: LoginResponse | LegacyLoginResponse
): d is LoginResponse {
  return typeof (d as LoginResponse).tokenInfo !== "undefined";
}

// 간단 이메일 형식 체크(프론트 보조용)
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTokens = useAuthStore((s: AuthState) => s.setTokens);
  const setProfile = useAuthStore((s: AuthState) => s.setProfile);
  const navigate = useNavigate();

  // (?token=...) 소셜 콜백 대응 — 가능하면 서버가 쿠키만 심고 /auth/reissue로 통일 권장
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      setTokens(token, null);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname + url.search);
      navigate("/");
    }
  }, [navigate, setTokens]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

      // 1) 로그인 호출
      const { data } = await api.post<LoginResponse | LegacyLoginResponse>(
        "/auth/login",
        { email: emailTrim, password: pwTrim },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // 쿠키 전략이라면 필수
        }
      );

      if (import.meta.env.DEV) {
        // 개발 모드에서만 로그
        // eslint-disable-next-line no-console
        console.debug("[login] response", data);
      }

      // 2) 응답에서 access/refresh 추출 (최신/레거시 모두 대응)
      const access = hasTokenInfo(data)
        ? data.tokenInfo.accessToken
        : (data.accessToken ?? null);

      const refresh = hasTokenInfo(data)
        ? (data.tokenInfo.refreshToken ?? null)
        : (data.refreshToken ?? null);

      if (!access) {
        throw new Error(
          "accessToken이 응답에 없습니다. 서버 응답 형식을 확인하세요."
        );
      }

      // 최신 스펙이면 nickname/email이 올 수 있음 → 프로필 세팅
      if (hasTokenInfo(data)) {
        // 서버가 nickname/email을 내려주는 스펙이면 저장
        const nickname = data.nickname as string | undefined;
        const emailFromRes = data.email as string | undefined;
        if (nickname) setProfile({ nickname, email: emailFromRes });
      }

      // refresh가 본문에 없더라도 '쿠키 기반'이면 정상 (zustand persist 권장)
      setTokens(access, refresh ?? null);

      navigate("/"); // 로그인 성공 → 홈
    } catch (err) {
      if (axios.isAxiosError<ErrorResponse>(err)) {
        // 401/403 등 서버 메시지 우선
        const msg =
          err.response?.data?.message ??
          (err.response?.status === 401
            ? "아이디 또는 비밀번호가 올바르지 않습니다."
            : "로그인에 실패했습니다.");
        setError(msg);

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
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
  };

  const startKakao = () => {
    if (loading) return;
    // 히스토리에 남는 게 괜찮다면 assign, 대체 이동은 replace
    window.location.assign(`${API_BASE}/auth/kakao`);
  };

  const startNaver = () => {
    if (loading) return;
    window.location.assign(`${API_BASE}/auth/naver/loginstart`);
  };

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
      />

      {/* 로그인 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="bg-purple w-full rounded-md py-2 text-white disabled:opacity-60"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {/* 에러 메시지 */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 링크 */}
      <div className="mt-[10px] flex justify-center gap-3 text-sm">
        <Link to="/resetPassword" className="text-h9 hover:underline">
          비밀번호 찾기
        </Link>
        <span className="text-h9">|</span>
        {/* 라우트 경로 케이스(대소문자)와 실제 라우트 일치 확인! */}
        <Link to="/signup" className="text-h9 hover:underline">
          회원가입
        </Link>
      </div>

      {/* 소셜 로그인 */}
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={startNaver}
          style={{ backgroundImage: `url(${naverBg})` }}
          className="flex h-[50px] w-full items-center justify-center rounded-md bg-cover bg-center"
          disabled={loading}
          aria-label="네이버 로그인"
        />
        <button
          type="button"
          onClick={startKakao}
          style={{ backgroundImage: `url(${kakaoBg})` }}
          className="flex h-[50px] w-full items-center justify-center rounded-md bg-cover bg-center"
          disabled={loading}
          aria-label="카카오 로그인"
        />
      </div>
    </form>
  );
};

export default LoginForm;
