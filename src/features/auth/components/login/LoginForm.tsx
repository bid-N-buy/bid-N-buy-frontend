import React, { useState } from "react";
import api from "../../../../shared/api/api"; // axios 인스턴스
import { useAuthStore } from "../../store/authStore"; // zustand store
import axios from "axios";
import { Link } from "react-router-dom";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // zustand store 메서드
  const { setToken } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("아이디와 비밀번호를 적어 주세요");
      return;
    }

    try {
      setLoading(true);

      // 로그인 요청
      const { data } = await api.post("/auth/login", { email, password });

      // accessToken을 메모리에 저장
      setToken(data.accessToken);

      // 로그인 성공 후 이동 (예시: 홈으로)
      window.location.href = "/";
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "로그인 실패");
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    }
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
        <button type="button" className="text-h9 hover:underline">
          비밀번호 찾기
        </button>
        <span className="text-h9">|</span>
        <Link to={"/signUp"} className="text-h9 hover:underline">
          회원가입
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;
