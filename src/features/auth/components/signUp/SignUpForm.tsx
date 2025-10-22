// src/features/auth/components/SignUpForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

/** 백엔드 절대 주소 (.env에 VITE_BACKEND_ADDRESS 정의) */
const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

/** 공개 전용 axios (Authorization 절대 안 붙음) */
const publicApi = axios.create({
  baseURL: BASE,
  withCredentials: true,
  timeout: 10_000,
});

/* =======================
 *        Types
 * ======================= */
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

/* 이메일 정규화 + 형식 체크(프론트 UX용) */
const normEmail = (raw: string) => raw.trim().toLowerCase();
const isEmailFormat = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const SignUpForm: React.FC = () => {
  const navigate = useNavigate();

  // form
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");

  // UX 상태
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);

  // timer/msg/loading
  const [leftSec, setLeftSec] = useState(0);
  const mm = useMemo(
    () => String(Math.floor(leftSec / 60)).padStart(2, "0"),
    [leftSec]
  );
  const ss = useMemo(() => String(leftSec % 60).padStart(2, "0"), [leftSec]);

  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 이메일 바뀌면 인증 단계 초기화
  useEffect(() => {
    setIsCodeSent(false);
    setIsVerified(false);
    setLastSentEmail(null);
    setCode("");
    setLeftSec(0);
  }, [email]);

  // ⏱️ 타이머 (인증코드 유효시간) — 인증되면 즉시 멈춤
  useEffect(() => {
    if (!isCodeSent || leftSec <= 0 || isVerified) return;
    const t = setInterval(() => setLeftSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [isCodeSent, leftSec, isVerified]);

  /* =======================
   *        Handlers
   * ======================= */

  // 1) 코드 전송
  const sendCode = async () => {
    setMsg(null);

    if (!isEmailFormat(email)) {
      setMsg("올바른 이메일 형식을 입력해 주세요.");
      return;
    }

    try {
      setLoadingSend(true);
      await publicApi.post("/auth/email/send", { email: normEmail(email) });

      setLastSentEmail(normEmail(email));
      setIsCodeSent(true);
      setIsVerified(false);
      setLeftSec(300); // 서버 만료(5분)와 동일
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

  // 2) 코드 검증
  const verifyCode = async () => {
    setMsg(null);

    if (!lastSentEmail || normEmail(email) !== lastSentEmail) {
      setMsg(
        "코드를 전송한 이메일과 현재 이메일이 달라요. 이메일을 맞춰주세요."
      );
      return;
    }
    if (!code.trim()) {
      setMsg("인증번호를 입력해 주세요.");
      return;
    }

    try {
      setLoadingVerify(true);
      await publicApi.post("/auth/email/verify", {
        email: normEmail(email),
        code: code.trim(), // 앞자리 0 보존
      });

      setIsVerified(true);
      setLeftSec(0); // ✅ 인증 성공 즉시 타이머 정지
      setMsg("이메일 인증이 완료되었습니다. ✅");
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

  // 3) 회원가입 제출
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    if (!email || !password || !nickname) {
      setMsg("이메일 / 비밀번호 / 닉네임을 입력해 주세요.");
      return;
    }
    if (!isEmailFormat(email)) {
      setMsg("올바른 이메일 형식을 입력해 주세요.");
      return;
    }
    if (password2 && password !== password2) {
      setMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 정책상 인증 필수라면 아래 주석 해제
    // if (!isVerified) {
    //   setMsg("이메일 인증을 완료해 주세요.");
    //   return;
    // }

    try {
      setLoadingSubmit(true);
      const { data } = await publicApi.post<UserDto>("/auth/signup", {
        email: normEmail(email),
        password,
        nickname,
      });

      if (data?.email) {
        navigate("/login?signedUp=1", { replace: true });
        setMsg("회원가입이 완료되었습니다. (인증메일 발송됨)");
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

  /* =======================
   *          UI
   * ======================= */

  return (
    <form onSubmit={handleSubmit} className="m-auto w-[420px]">
      {/* 이메일 */}
      <div className="mb-[20px]">
        <h5 className="text-h5 mb-[8px] font-bold">이메일</h5>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isCodeSent && !isVerified}
          className="focus:border-purple mb-[12px] h-[40px] w-[420px] rounded-md border px-3 outline-none focus:border-2"
          placeholder="이메일을 입력해 주세요"
          autoComplete="email"
        />

        <div className="flex gap-[10px]">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="focus:border-purple h-[50px] w-[190px] rounded-md border px-3 outline-none focus:border-2"
            placeholder="인증번호 입력"
            inputMode="numeric"
            disabled={!isCodeSent || isVerified}
          />
          <button
            type="button"
            onClick={sendCode}
            // ✅ 인증 완료면 버튼은 보이되 항상 비활성화 (타이머/재전송 텍스트도 없음)
            disabled={
              isVerified ||
              loadingSend ||
              (isCodeSent && leftSec > 0) || // 쿨다운
              !isEmailFormat(email)
            }
            className={[
              "h-[50px] w-[120px] rounded-md border disabled:opacity-60",
              isVerified
                ? "border-g300 text-g300 bg-g500/20 cursor-not-allowed"
                : "border-purple text-purple hover:bg-light-purple/40",
            ].join(" ")}
          >
            {isVerified
              ? "전송됨" // 인증 완료 상태: 타이머/재전송 표시 X
              : isCodeSent && leftSec > 0
                ? `재전송 ${mm}:${ss}`
                : "코드 전송"}
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
          className="focus:border-purple mb-[20px] h-[40px] w-[420px] rounded-md border px-3 outline-none focus:border-2"
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
        {loadingSubmit ? "가입 중..." : "회원가입 하기"}
      </button>
    </form>
  );
};

export default SignUpForm;
