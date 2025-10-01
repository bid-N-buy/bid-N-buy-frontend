import React, { useState } from "react";
import api from "../../api/api"; // axios 인스턴스
import { useAuthStore } from "../../store/authStore"; // zustand store

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
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "로그인 실패");
    } finally {
      setLoading(false);
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
        className="w-full rounded border px-3 py-2"
        disabled={loading}
      />

      <input
        name="password"
        type="password"
        id="password"
        placeholder="비밀번호를 입력해 주세요"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border px-3 py-2"
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-violet-600 py-2 text-white"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="mt-2 flex justify-center gap-3 text-sm">
        <button type="button" className="hover:underline">
          비밀번호 찾기
        </button>
        <span>|</span>
        <button type="button" className="hover:underline">
          회원가입
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
