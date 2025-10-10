import React, { useEffect, useState } from "react";
import api from "../../../../shared/api/axiosInstance";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setToken } = useAuthStore();

  // 콜백에서 ?token=... 으로 돌려받는 경우 처리
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      setToken(token);
      url.searchParams.delete("token");
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search ? `?${url.searchParams}` : "")
      );
      window.location.href = "/";
    }
  }, [setToken]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("아이디와 비밀번호를 적어 주세요");
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { email, password });
      setToken(data.accessToken);
      window.location.href = "/";
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "로그인 실패");
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ 소셜 시작 경로
  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
  // const REDIRECT_URI = window.location.origin + "/oauth/callback"; // 백엔드가 지원하면 사용

  const startKakao = () => {
    // 백엔드가 redirect_uri를 받으면 아래처럼:
    // window.location.href = `${API_BASE}/auth/kakao?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    // 받지 않으면 그냥:
    window.location.href = `${API_BASE}/auth/kakao`;
  };

  const startNaver = () => {
    // redirect_uri 지원 시:
    // window.location.href = `${API_BASE}/auth/naver/loginstart?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = `${API_BASE}/auth/naver/loginstart`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="email"
        type="email"
        id="email"
        placeholder="이메일을 입력해 주세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="hover:border-purple w-full rounded-md border px-3 py-2"
        disabled={loading}
      />

      <input
        name="password"
        type="password"
        id="password"
        placeholder="비밀번호를 입력해 주세요"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="hover:border-purple w-full rounded-md border px-3 py-2"
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-purple w-full rounded-md py-2 text-white"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="mt-[10px] flex justify-center gap-3 text-sm">
        <Link
          to={"/resetPassword"}
          type="button"
          className="text-h9 hover:underline"
        >
          비밀번호 찾기
        </Link>
        <span className="text-h9">|</span>
        <Link to={"/signUp"} className="text-h9 hover:underline">
          회원가입
        </Link>
      </div>

      {/* 소셜 로그인 버튼 */}
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={startNaver}
          className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2"
          disabled={loading}
        >
          <img src="/icons/naver.svg" alt="" className="h-5 w-5" />
          <span className="text-sm">네이버로 로그인</span>
        </button>

        <button
          type="button"
          onClick={startKakao}
          className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2"
          disabled={loading}
        >
          <img src="/icons/kakao.svg" alt="" className="h-5 w-5" />
          <span className="text-sm">카카오로 로그인</span>
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
