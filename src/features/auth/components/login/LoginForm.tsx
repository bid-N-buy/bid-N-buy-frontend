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
  accessToken?: string;
  refreshToken?: string;
};

function hasTokenInfo(
  d: LoginResponse | LegacyLoginResponse
): d is LoginResponse {
  return (d as LoginResponse).tokenInfo !== undefined;
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTokens = useAuthStore((s: AuthState) => s.setTokens);
  const navigate = useNavigate();

  // (?token=...) 소셜 콜백 대응 — 가능하면 서버가 쿠키만 심고 /auth/reissue로 통일 권장
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      // 구형 방식 대응: access 만 저장(refresh는 서버 쿠키가 있거나, 이후 reissue로 회복)
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

    if (!email || !password) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);

      // 1) 로그인 호출
      const { data } = await api.post<LoginResponse | LegacyLoginResponse>(
        "/auth/login",
        { email, password }
      );

      // 2) 응답에서 access/refresh 추출 (여러 스펙 대응)
      const access = hasTokenInfo(data)
        ? data.tokenInfo.accessToken
        : (data.accessToken ?? null);

      const refresh = hasTokenInfo(data)
        ? (data.tokenInfo.refreshToken ?? null)
        : (data.refreshToken ?? null);

      // ─────────────────────────────────────────────────────────
      // 중요한 포인트:
      // - 서버가 refresh를 HttpOnly 쿠키로만 주는 경우, 본문엔 refresh가 없습니다.
      // - 이때는 access 만 저장하고, 새로고침 때 useAuthInit()에서 /auth/reissue 로 access 회복.
      // ─────────────────────────────────────────────────────────
      if (!access) {
        throw new Error(
          "accessToken이 응답에 없습니다. 서버 응답 형식을 확인하세요."
        );
      }

      // refresh가 본문에 없더라도 '쿠키 기반'이면 정상.
      setTokens(access, refresh /* null일 수 있음(쿠키 관리) */);

      navigate("/"); // 새로고침 없이 이동 (zustand 메모리 유지)
    } catch (err) {
      if (axios.isAxiosError<ErrorResponse>(err)) {
        setError(err.response?.data?.message ?? "로그인 실패");
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
    window.location.href = `${API_BASE}/auth/kakao`;
  };

  const startNaver = () => {
    if (loading) return;
    window.location.href = `${API_BASE}/auth/naver/loginstart`;
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
        <Link to="/signUp" className="text-h9 hover:underline">
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
