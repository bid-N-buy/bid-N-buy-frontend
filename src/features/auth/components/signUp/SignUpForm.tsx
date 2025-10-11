// src/features/auth/components/SignUpForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios, { type AxiosError } from "axios";

/** 백엔드 절대 주소 (.env에 VITE_BACKEND_ADDRESS 정의) */
const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

/** ✅ 공개 전용 axios (Authorization 절대 안 붙음) */
const publicApi = axios.create({
  baseURL: BASE,
  withCredentials: true, // 서버가 쿠키 세션을 쓴다면 true 유지. (JWT 헤더면 false 가능)
  timeout: 10_000,
});

type ApiErr = {
  message?: string;
  error?: string;
  ok?: boolean;
  available?: boolean;
};

/**
 * 엔드포인트 요약 (백엔드 명세에 맞춰 조정):
 * GET  /auth/email/check?email=...
 * POST /auth/email/send   { email }
 * POST /auth/email/verify { email, code }
 * POST /signup            { email, password, nickname }
 */
const SignUpForm: React.FC = () => {
  // form
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");

  // UX 상태(제출은 막지 않음)
  const [isEmailChecked, setIsEmailChecked] = useState<boolean | null>(null); // null=미확인
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // timer/msg/loading
  const [leftSec, setLeftSec] = useState(0);
  const mm = useMemo(
    () => String(Math.floor(leftSec / 60)).padStart(2, "0"),
    [leftSec]
  );
  const ss = useMemo(() => String(leftSec % 60).padStart(2, "0"), [leftSec]);

  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  // 이메일 변경 시 인증 단계 초기화
  useEffect(() => {
    setIsEmailChecked(null);
    setIsCodeSent(false);
    setIsVerified(false);
    setCode("");
    setLeftSec(0);
  }, [email]);

  // 타이머
  useEffect(() => {
    if (!isCodeSent || leftSec <= 0) return;
    const t = setInterval(() => setLeftSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [isCodeSent, leftSec]);

  // 1) 이메일 중복확인 (선택)
  const checkEmail = async () => {
    setMsg(null);
    try {
      setLoadingCheck(true);
      const { data } = await publicApi.get<{ available: boolean }>(
        "/auth/email/check",
        {
          params: { email },
        }
      );
      setIsEmailChecked(!!data?.available);
      if (!data?.available) setMsg("이미 사용 중인 이메일입니다.");
    } catch (e) {
      const err = e as AxiosError<ApiErr>;
      setIsEmailChecked(null);
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "이메일 확인 실패"
      );
    } finally {
      setLoadingCheck(false);
    }
  };

  // 2) 코드 전송 (선택)
  const sendCode = async () => {
    setMsg(null);
    try {
      setLoadingSend(true);
      await publicApi.post("/auth/email/send", { email });
      setIsCodeSent(true);
      setLeftSec(600);
      setMsg("인증코드를 전송했어요. 메일함을 확인하세요.");
    } catch (e) {
      const err = e as AxiosError<ApiErr>;
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "코드 전송 실패"
      );
    } finally {
      setLoadingSend(false);
    }
  };

  // 3) 코드 검증 (선택)
  const verifyCode = async () => {
    setMsg(null);
    try {
      setLoadingVerify(true);
      const { data } = await publicApi.post<{ ok: boolean }>(
        "/auth/email/verify",
        { email, code }
      );
      setIsVerified(!!data?.ok);
      setMsg(
        data?.ok
          ? "이메일 인증이 완료되었습니다. ✅"
          : "인증 실패: 코드가 틀리거나 만료되었습니다."
      );
    } catch (e) {
      const err = e as AxiosError<ApiErr>;
      setIsVerified(false);
      setMsg(
        err.response?.data?.message ?? err.response?.data?.error ?? "인증 실패"
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  // 4) 회원가입 제출 (서버 판정 우선)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    // 최소 입력 체크 (원하면 제거 가능)
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
      const { data } = await publicApi.post("/signup", {
        email,
        password,
        nickname,
      });
      if (data?.email || data?.ok) {
        setMsg("회원가입이 완료되었습니다.");
        // TODO: 필요 시 이동 → window.location.href = "/login";
      } else {
        setMsg(data?.message ?? "회원가입 처리에 실패했습니다.");
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

        <div className="mb-[10px] flex w-[420px] items-center justify-between">
          {isEmailChecked === false && (
            <p className="text-h7 text-red">중복된 이메일 입니다.</p>
          )}
          {isEmailChecked === true && (
            <p className="text-h7 text-green">사용 가능한 이메일입니다.</p>
          )}
          {isEmailChecked === null && (
            <p className="text-h7 text-g300">중복확인을 진행하세요.</p>
          )}

          <button
            type="button"
            onClick={checkEmail}
            disabled={loadingCheck || !email}
            className={`h-[30px] w-[100px] rounded-md border ${
              isEmailChecked
                ? "border-green text-green"
                : "border-purple text-purple hover:bg-light-purple/40"
            } disabled:opacity-60`}
          >
            {isEmailChecked
              ? "사용가능"
              : loadingCheck
                ? "확인중…"
                : "중복 확인"}
          </button>
        </div>

        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus:border-purple mb-[15px] h-[40px] w-[420px] rounded-md border px-3 outline-none focus:border-2"
            placeholder="이메일을 입력해 주세요"
            autoComplete="email"
          />

          <div className="flex gap-[10px]">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="focus:border-purple h-[50px] w-[190px] rounded-md border px-3 outline-none focus:border-2"
              placeholder="인증번호(선택)"
              inputMode="numeric"
              disabled={!isCodeSent || isVerified}
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={loadingSend || (isCodeSent && leftSec > 0) || !email}
              className="border-purple text-purple hover:bg-light-purple/40 h-[50px] w-[120px] rounded-md border disabled:opacity-60"
            >
              {isCodeSent && leftSec > 0 ? `재전송 ${mm}:${ss}` : "코드 전송"}
            </button>
            <button
              type="button"
              onClick={verifyCode}
              disabled={loadingVerify || isVerified || !isCodeSent}
              className={`h-[50px] w-[90px] rounded-md font-medium text-white disabled:opacity-60 ${
                isVerified ? "bg-g400" : "bg-purple hover:opacity-90"
              }`}
            >
              {isVerified ? "완료" : "인증"}
            </button>
          </div>
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
        회원가입 하기
      </button>
    </form>
  );
};

export default SignUpForm;
