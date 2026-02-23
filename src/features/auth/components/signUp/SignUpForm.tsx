// src/features/auth/components/SignUpForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { API_BASE } from "../../../../shared/api/axiosInstance";
import { useNavigate } from "react-router-dom";
import Toast from "../../../../shared/components/Toast";

const publicApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 10_000,
});

type ApiErr = { message?: string; error?: string };
type UserDto = {
  userId: number;
  adminId: number;
  addressId: number;
  email: string;
  password: string | null;
  nickname: string;
  authStatus: "Y" | "N" | null;
  userStatus: string | null;
  userType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

const normEmail = (raw: string) => raw.trim().toLowerCase();
const isEmailFormat = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const SignUpForm: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);

  const [leftSec, setLeftSec] = useState(0);
  const mm = useMemo(
    () => String(Math.floor(leftSec / 60)).padStart(2, "0"),
    [leftSec]
  );
  const ss = useMemo(() => String(leftSec % 60).padStart(2, "0"), [leftSec]);

  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // ✅ 토스트 상태
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    onClose?: () => void;
  } | null>(null);

  useEffect(() => {
    setIsCodeSent(false);
    setIsVerified(false);
    setLastSentEmail(null);
    setCode("");
    setLeftSec(0);
  }, [email]);

  useEffect(() => {
    if (!isCodeSent || leftSec <= 0 || isVerified) return;
    const t = setInterval(() => setLeftSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [isCodeSent, leftSec, isVerified]);

  const sendCode = async () => {
    if (!isEmailFormat(email)) {
      setToast({
        message: "올바른 이메일 형식을 입력해 주세요.",
        type: "error",
      });
      return;
    }
    try {
      setLoadingSend(true);
      await publicApi.post("/auth/email/send", { email: normEmail(email) });
      setLastSentEmail(normEmail(email));
      setIsCodeSent(true);
      setIsVerified(false);
      setLeftSec(300);
      setToast({
        message: "인증코드를 전송했어요. 메일함을 확인하세요.",
        type: "success",
      });
    } catch (e) {
      const err = e as AxiosError<ApiErr>;
      setToast({
        message:
          err.response?.data?.message ??
          err.response?.data?.error ??
          "코드 전송 실패",
        type: "error",
      });
    } finally {
      setLoadingSend(false);
    }
  };

  const verifyCode = async () => {
    if (!lastSentEmail || normEmail(email) !== lastSentEmail) {
      setToast({
        message: "코드를 전송한 이메일과 현재 이메일이 달라요.",
        type: "error",
      });
      return;
    }
    if (!code.trim()) {
      setToast({ message: "인증번호를 입력해 주세요.", type: "error" });
      return;
    }
    try {
      setLoadingVerify(true);
      await publicApi.post("/auth/email/verify", {
        email: normEmail(email),
        code: code.trim(),
      });
      setIsVerified(true);
      setLeftSec(0);
      setToast({ message: "이메일 인증이 완료되었습니다.", type: "success" });
    } catch (e) {
      const err = e as AxiosError<ApiErr>;
      setIsVerified(false);
      setToast({
        message:
          err.response?.data?.message ??
          err.response?.data?.error ??
          "인증 실패",
        type: "error",
      });
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password || !nickname) {
      setToast({
        message: "이메일 / 비밀번호 / 닉네임을 입력해 주세요.",
        type: "error",
      });
      return;
    }
    if (!isEmailFormat(email)) {
      setToast({
        message: "올바른 이메일 형식을 입력해 주세요.",
        type: "error",
      });
      return;
    }
    if (password2 && password !== password2) {
      setToast({ message: "비밀번호가 일치하지 않습니다.", type: "error" });
      return;
    }

    try {
      setLoadingSubmit(true);
      const { data } = await publicApi.post<UserDto>("/auth/signup", {
        email: normEmail(email),
        password,
        nickname,
      });

      if (data?.email) {
        const go = () => navigate("/login?signedUp=1", { replace: true });
        setToast({
          message: "회원가입이 완료되었습니다.",
          type: "success",
          onClose: go,
        });
      } else {
        setToast({ message: "회원가입 처리에 실패했습니다.", type: "error" });
      }
    } catch (e) {
      const err = e as AxiosError<ApiErr>;
      setToast({
        message:
          err.response?.data?.message ??
          err.response?.data?.error ??
          "회원가입 실패",
        type: "error",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ✅ 공통 클래스 (반응형 높이/폰트)
  const inputCls =
    "h-12 sm:h-[52px] md:h-[56px] w-full rounded-md border px-3 sm:px-3.5 outline-none " +
    "focus:border-2 hover:border-purple focus:border-purple text-[14px] sm:text-[15px]";
  const btnPrimaryCls =
    "h-12 sm:h-[52px] md:h-[56px] w-full rounded-md text-white transition " +
    "bg-purple hover:bg-deep-purple disabled:opacity-60 text-[15px] sm:text-[16px] font-semibold";

  return (
    <>
      {/* ✅ 토스트 출력 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={2400}
          onClose={() => {
            const cb = toast.onClose;
            setToast(null);
            cb?.();
          }}
        />
      )}

      {/* ✅ 컨테이너: 뷰포트별 최대폭 조절 */}
      <div className="mx-auto w-full max-w-[360px] px-4 py-8 sm:max-w-[420px] sm:px-0 sm:py-10 md:max-w-[480px] md:py-12 lg:max-w-[560px]">
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* 이메일 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-h5 font-bold">이메일</h5>
              {isVerified ? (
                <span className="text-[13px] text-green-600">
                  이메일 인증이 완료되었습니다.
                </span>
              ) : (
                !isEmailFormat(email) &&
                email && (
                  <span className="text-[13px] text-red-500">
                    형식이 올바르지 않습니다.
                  </span>
                )
              )}
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isCodeSent && !isVerified}
              className={`${inputCls} mb-3`}
              placeholder="이메일을 입력해 주세요"
              autoComplete="email"
            />

            {/* 인증번호 라벨 + 상태 */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[14px] font-medium text-gray-700">
                인증번호
              </span>
              {!isVerified && isCodeSent && leftSec > 0 && (
                <span className="text-purple text-[13px]">
                  인증번호를 입력해 주세요 (유효시간 {mm}:{ss})
                </span>
              )}
              {!isVerified && isCodeSent && leftSec <= 0 && (
                <span className="text-[13px] text-red-500">
                  인증번호가 만료되었습니다. 재전송 해주세요
                </span>
              )}
              {isVerified && (
                <span className="text-[13px] text-green-600">인증 완료</span>
              )}
            </div>

            {/* 모바일=세로 스택, sm 이상=3열 그리드 */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto] sm:gap-2.5">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={inputCls}
                placeholder="인증번호 입력"
                inputMode="numeric"
                disabled={!isCodeSent || isVerified}
                autoComplete="one-time-code"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={
                  isVerified ||
                  loadingSend ||
                  (isCodeSent && leftSec > 0) ||
                  !isEmailFormat(email)
                }
                className={[
                  "h-12 rounded-md border px-4 text-[14px] disabled:opacity-60 sm:h-[52px] sm:text-[15px] md:h-[56px]",
                  isVerified
                    ? "border-g300 text-g300 bg-g500/20 cursor-not-allowed"
                    : "border-purple text-purple hover:bg-light-purple/40",
                ].join(" ")}
              >
                {isVerified
                  ? "전송됨"
                  : isCodeSent && leftSec > 0
                    ? `재전송 ${mm}:${ss}`
                    : "코드 전송"}
              </button>
              <button
                type="button"
                onClick={verifyCode}
                disabled={loadingVerify || isVerified || !isCodeSent}
                className={`h-12 rounded-md px-4 text-[14px] font-medium text-white disabled:opacity-60 sm:h-[52px] sm:text-[15px] md:h-[56px] ${
                  isVerified ? "bg-g400" : "bg-purple hover:opacity-90"
                }`}
              >
                {isVerified ? "완료" : "인증"}
              </button>
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-h5 font-bold">비밀번호</h5>
              {password && password.length < 8 && (
                <span className="text-[13px] text-red-500">
                  8자 이상 입력하세요
                </span>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="비밀번호를 입력해 주세요"
              autoComplete="new-password"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-h5 font-bold">비밀번호 확인</h5>
              {password2 && password !== password2 && (
                <span className="text-[13px] text-red-500">
                  비밀번호가 일치하지 않습니다
                </span>
              )}
            </div>
            <input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={inputCls}
              placeholder="비밀번호를 다시 입력해 주세요"
              autoComplete="new-password"
            />
          </div>

          {/* 닉네임 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-h5 font-bold">닉네임</h5>
              {nickname.trim().length === 0 && (
                <span className="text-[13px] text-red-500">
                  닉네임을 입력해 주세요
                </span>
              )}
            </div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputCls}
              placeholder="닉네임을 입력해 주세요"
              autoComplete="nickname"
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loadingSubmit}
            className={btnPrimaryCls}
          >
            {loadingSubmit ? "가입 중..." : "회원가입 하기"}
          </button>
        </form>
      </div>
    </>
  );
};

export default SignUpForm;
