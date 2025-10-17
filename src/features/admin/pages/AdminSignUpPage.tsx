import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import type { AdminDto } from "../types/AdminType";
import { ChevronRight } from "lucide-react";

type ApiErr = { message?: string; error?: string };
const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

const normEmail = (raw: string) => raw.trim().toLowerCase();

/** 공개 전용 axios (Authorization 절대 안 붙음) */
const publicApi = axios.create({
  baseURL: BASE,
  withCredentials: true,
  timeout: 10_000,
});

const AdminSignUpPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");

  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 4) 회원가입 제출
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    if (!email || !password || !nickname) {
      setMsg("이메일 / 비밀번호 / 닉네임을 입력해 주세요.");
      return;
    }
    if (password2 && password !== password2) {
      setMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoadingSubmit(true);

      const { data } = await publicApi.post<AdminDto>("/admin/auth/signup", {
        email: normEmail(email),
        password,
        nickname,
      });

      if (data?.email) {
        // ✅ 가입 성공 → 로그인 페이지로 이동 (+ 배너 표시용 쿼리)
        navigate("/login?signedUp=1", { replace: true });
        setMsg("회원가입이 완료되었습니다. (인증메일 발송됨)");
        // 필요 시 이동:
        // window.location.href = "/login";
      } else {
        setMsg("회원가입 처리에 실패했습니다.");
      }
    } catch (e) {
      const err = e as AxiosError<ApiErr>;
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "회원가입 실패"
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="m-auto w-[420px]">
      {/* 이메일 + (선택) 중복확인/인증 */}
      <div className="mb-[20px]">
        <h5 className="text-h5 font-bold">이메일</h5>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus:border-purple mb-[15px] h-[40px] w-[420px] rounded-md border px-3 outline-none focus:border-2"
            placeholder="이메일을 입력해 주세요"
            autoComplete="email"
          />
        </div>
      </div>

      {/* 비밀번호 */}
      <div>
        <div className="mb-[20px]">
          <h5 className="text-h5 mb-[10px] font-bold">비밀번호</h5>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus:border-purple mb-[5px] h-[40px] w-[420px] rounded-md border px-3 outline-none focus:border-2"
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="new-password"
          />
        </div>

        <div className="mb-[20px]">
          <h5 className="text-h5 mb-[10px] font-bold">비밀번호 확인</h5>
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="focus:border-purple mb-[5px] h-[40px] w-[420px] rounded-md border px-3 outline-none focus:border-2"
            placeholder="비밀번호를 다시 입력해 주세요"
            autoComplete="new-password"
          />
        </div>
      </div>

      {/* 닉네임 */}
      <div>
        <h5 className="text-h5 mb-[10px] font-bold">닉네임</h5>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="focus:border-purple mb-[50px] h-[40px] w-[420px] rounded-md border px-3 outline-none focus:border-2"
          placeholder="닉네임을 입력해 주세요"
          autoComplete="nickname"
        />
      </div>

      <div>
        <label htmlFor="ipConsentAgreed">
          <span className="flex">
            <input
              type="checkbox"
              name="ipConsentAgreed"
              id="ipConsentAgreed"
              className="mr-1"
            />
            IP 수집 및 이용에 동의합니다
            <ChevronRight />
          </span>
        </label>
      </div>

      {/* 서버 메시지 */}
      {msg && (
        <p className="border-g400 bg-g500/40 text-g100 mb-[12px] rounded-md border py-2 text-center">
          {msg}
        </p>
      )}

      <button
        type="submit"
        disabled={loadingSubmit}
        className="bg-purple hover:bg-deep-purple h-[50px] w-[420px] rounded-md text-white disabled:opacity-60"
      >
        {loadingSubmit ? "가입 중..." : "회원가입 하기"}
      </button>
    </form>
  );
};

export default AdminSignUpPage;
