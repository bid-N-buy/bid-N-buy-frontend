// src/pages/auth/ResetPassword.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000",
  withCredentials: true,
  timeout: 10_000,
});

type Step = "request" | "reset"; // ← 단계 분리

export default function ResetPassword() {
  const [step, setStep] = useState<Step>("request");

  // 공통 상태
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // 1단계: 코드 전송/인증
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  // 서버가 임시비번을 요구하면 true로
  const useTempPassword = false;

  // 타이머
  const [leftSec, setLeftSec] = useState(0);
  const mm = useMemo(
    () => String(Math.floor(leftSec / 60)).padStart(2, "0"),
    [leftSec]
  );
  const ss = useMemo(() => String(leftSec % 60).padStart(2, "0"), [leftSec]);

  useEffect(() => {
    if (!isCodeSent || leftSec <= 0) return;
    const t = setInterval(() => setLeftSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [isCodeSent, leftSec]);

  // 이메일 바뀌면 1단계 초기화
  useEffect(() => {
    setIsCodeSent(false);
    setCode("");
    setLeftSec(0);
    setMsg(null);
    setStep("request");
  }, [email]);

  const sendCode = async () => {
    setMsg(null);
    try {
      setLoadingSend(true);
      const { data } = await api.post("/auth/password/request", { email });
      setMsg(data?.message ?? "인증코드를 이메일로 전송했습니다.");
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

  const verifyCode = async () => {
    setMsg(null);
    try {
      setLoadingVerify(true);
      const body = useTempPassword
        ? { email, tempPassword: code }
        : { email, code };
      const { data } = await api.post("/auth/password/verify", body);
      if (data?.ok ?? true) {
        setMsg(data?.message ?? "인증이 완료되었습니다.");
        setStep("reset"); // ← 인증되면 2단계로 전환
      } else {
        setMsg(data?.message ?? "인증 실패");
      }
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setMsg(
        err.response?.data?.message ?? err.response?.data?.error ?? "인증 실패"
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  // 2단계: 비밀번호 재설정
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
      const { data } = await api.post("/auth/password/reset", {
        email,
        newPassword: newPw,
      });
      setMsg(data?.message ?? "비밀번호가 재설정되었습니다. 로그인 해주세요.");
      // 필요 시 여기서 로그인 페이지로 이동 처리 가능
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
    <div className="mx-auto w-[420px]">
      {/* 헤더 */}
      <h1 className="mt-2 mb-6 text-center text-2xl font-bold">
        {step === "request" ? "비밀번호 재발급" : "비밀번호 변경"}
      </h1>
      <div className="mb-6 h-px w-full bg-gray-300" />

      {/* 1단계: 코드 요청/인증 (왼쪽 화면) */}
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
                placeholder={
                  useTempPassword ? "임시비밀번호 입력" : "인증코드 입력"
                }
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

      {/* 2단계: 비밀번호 변경 (오른쪽 화면) */}
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

          {/* 현재 이메일 고정 노출 (선택) */}
          <div className="text-sm text-gray-500">
            계정 이메일: <span className="font-medium">{email}</span>
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
