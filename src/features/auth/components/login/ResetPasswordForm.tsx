import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080",
  withCredentials: true,
  timeout: 10_000,
});

/** 서버가 기대하는 전송 포맷: 필요 시 "form" 으로 변경 */
const REQUEST_MODE: "json" | "form" = "json";

type Step = "request" | "reset";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");

  // 공통 상태
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // 1단계: 임시비밀번호(코드) 전송/인증
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  // 서버 스펙: verify 는 tempPassword 로 받음
  // const useTempPassword = true;

  // 타이머
  const [leftSec, setLeftSec] = useState(0);
  const mm = useMemo(
    () => String(Math.floor(leftSec / 60)).padStart(2, "0"),
    [leftSec]
  );
  const ss = useMemo(() => String(leftSec % 60).padStart(2, "0"), [leftSec]);

  useEffect(() => {
    if (!isCodeSent || leftSec <= 0) return;
    const t = window.setInterval(() => setLeftSec((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [isCodeSent, leftSec]);

  // 이메일 바뀌면 1단계 초기화
  useEffect(() => {
    setIsCodeSent(false);
    setCode("");
    setLeftSec(0);
    setMsg(null);
    setStep("request");
  }, [email]);

  const asJson = (url: string, body: Record<string, any>) =>
    api.post(url, body, { headers: { "Content-Type": "application/json" } });

  const asForm = (url: string, body: Record<string, any>) => {
    const form = new URLSearchParams();
    Object.entries(body).forEach(([k, v]) => form.append(k, String(v)));
    return api.post(url, form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  };

  const post = (url: string, body: Record<string, any>) =>
    REQUEST_MODE === "json" ? asJson(url, body) : asForm(url, body);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  /** 1) 임시비밀번호(코드) 전송 */
  const sendCode = async () => {
    setMsg(null);

    if (!normalizedEmail) {
      setMsg("이메일을 입력해주세요.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMsg("이메일 형식을 확인해주세요.");
      return;
    }

    try {
      setLoadingSend(true);
      // 서버 스펙: request 는 email 만
      const { data } = await post("/auth/password/request", {
        email: normalizedEmail,
      });
      setMsg(data?.message ?? "임시비밀번호를 이메일로 전송했습니다.");
      setIsCodeSent(true);
      setLeftSec(600);
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setMsg(
        err.response?.data?.message ?? err.response?.data?.error ?? "요청 실패"
      );
    } finally {
      setLoadingSend(false);
    }
  };

  /** 2) 임시비밀번호(코드) 인증 */
  const verifyCode = async () => {
    setMsg(null);

    if (!isCodeSent) {
      setMsg("먼저 임시비밀번호를 전송해주세요.");
      return;
    }
    if (!normalizedCode) {
      setMsg("임시비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoadingVerify(true);
      // 서버 스펙: verify 는 tempPassword 로 받음
      const body = { email: normalizedEmail, tempPassword: normalizedCode };
      const { data } = await post("/auth/password/verify", body);

      if (data?.ok === false) {
        setMsg(data?.message ?? "인증 실패");
        return;
      }

      setMsg(data?.message ?? "인증이 완료되었습니다.");
      setStep("reset");
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setMsg(
        err.response?.data?.message ?? err.response?.data?.error ?? "인증 실패"
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  // 3) 비밀번호 재설정
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    if (!newPw || newPw.length < 8) {
      setMsg("영문, 숫자를 포함한 8자 이상으로 입력해주세요.");
      return;
    }
    if (newPw !== newPw2) {
      setMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoadingReset(true);
      // 서버 스펙: reset 은 email + newPassword
      const payload = { email: normalizedEmail, newPassword: newPw };
      const { data } = await post("/auth/password/reset", payload);
      setMsg(data?.message ?? "비밀번호가 재설정되었습니다. 로그인 해주세요.");

      // 성공 후 메인으로 이동 (잠깐 메시지 보여주고 이동)
      window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 600);
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "비밀번호 재설정 실패"
      );
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="mx-auto my-[200px] w-[420px]">
      {/* 헤더 */}
      <h1 className="mt-2 mb-6 text-center text-2xl font-bold">
        {step === "request" ? "비밀번호 재발급" : "비밀번호 변경"}
      </h1>
      <div className="mb-6 h-px w-full bg-gray-300" />

      {/* 1단계: 임시비밀번호 요청/인증 */}
      {step === "request" && (
        <div className="space-y-4">
          <div>
            <h5 className="mb-[10px] font-bold">이메일</h5>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus:border-purple mb-[10px] h-[40px] w-full rounded-md border px-3 outline-none focus:border-2"
              placeholder="이메일 입력"
              autoComplete="email"
            />

            <div className="flex gap-[10px]">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="focus:border-purple h-[40px] w-[210px] rounded-md border px-3 outline-none focus:border-2"
                placeholder="임시비밀번호 입력"
                disabled={!isCodeSent}
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={loadingSend || (isCodeSent && leftSec > 0) || !email}
                className="border-purple text-purple hover:bg-purple/5 h-[40px] w-[95px] rounded-md border disabled:opacity-60"
              >
                {isCodeSent && leftSec > 0 ? `재전송 ${mm}:${ss}` : "코드 전송"}
              </button>
              <button
                type="button"
                onClick={verifyCode}
                disabled={loadingVerify || !isCodeSent || !code}
                className="bg-purple h-[40px] w-[95px] rounded-md font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                인증 하기
              </button>
            </div>
          </div>

          {msg && (
            <p className="rounded-md border border-gray-300 bg-gray-100 py-2 text-center text-gray-700">
              {msg}
            </p>
          )}
        </div>
      )}

      {/* 2단계: 비밀번호 변경 */}
      {step === "reset" && (
        <form onSubmit={resetPassword} className="space-y-5">
          <div>
            <h5 className="mb-2 font-bold">새 비밀번호</h5>
            <p className="mb-2 text-sm text-gray-500">
              영문, 숫자를 포함한 8자
            </p>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="focus:border-purple mb-2 h-[40px] w-full rounded-md border px-3 outline-none focus:border-2"
              placeholder="새 비밀번호 입력"
              autoComplete="new-password"
            />
            <input
              type="password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              className="focus:border-purple h-[40px] w-full rounded-md border px-3 outline-none focus:border-2"
              placeholder="새 비밀번호 확인"
              autoComplete="new-password"
            />
          </div>

          <div className="text-sm text-gray-500">
            계정 이메일: <span className="font-medium">{normalizedEmail}</span>
          </div>

          {msg && (
            <p className="rounded-md border border-gray-300 bg-gray-100 py-2 text-center text-gray-700">
              {msg}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("request")}
              className="h-[48px] flex-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              이전
            </button>
            <button
              type="submit"
              disabled={loadingReset}
              className="bg-purple h-[48px] flex-1 rounded-md text-white hover:opacity-90 disabled:opacity-60"
            >
              비밀번호 변경
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
