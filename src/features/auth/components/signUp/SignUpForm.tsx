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
type EmailCheckResponse = { available: boolean };
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

/* 이메일 정규화(서버와 통일) */
const normEmail = (raw: string) => raw.trim().toLowerCase();

const SignUpForm: React.FC = () => {
  const navigate = useNavigate(); // ✅ 추가

  // form
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");

  // UX 상태
  const [isEmailChecked, setIsEmailChecked] = useState<boolean | null>(null); // null=미확인
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null); // ✅ 보낸 이메일 기억

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

  // 이메일 바뀌면 인증 단계 초기화
  useEffect(() => {
    setIsEmailChecked(null);
    setIsCodeSent(false);
    setIsVerified(false);
    setLastSentEmail(null);
    setCode("");
    setLeftSec(0);
  }, [email]);

  // 타이머
  useEffect(() => {
    if (!isCodeSent || leftSec <= 0) return;
    const t = setInterval(() => setLeftSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [isCodeSent, leftSec]);

  /* =======================
   *        Handlers
   * ======================= */

  // 1) 이메일 중복확인
  const checkEmail = async () => {
    setMsg(null);
    try {
      setLoadingCheck(true);
      const { data } = await publicApi.get<EmailCheckResponse>(
        "/auth/email/check",
        {
          params: { email: normEmail(email) },
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

  // 2) 코드 전송
  const sendCode = async () => {
    setMsg(null);
    try {
      setLoadingSend(true);
      await publicApi.post("/auth/email/send", { email: normEmail(email) });

      setLastSentEmail(normEmail(email)); // ✅ 이 이메일로만 verify 허용
      setIsCodeSent(true);
      setLeftSec(300); // ✅ 서버 만료(5분)와 동일
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

  // 3) 코드 검증 (HTTP 200이면 성공)
  const verifyCode = async () => {
    setMsg(null);

    // 보낸 이메일과 현재 이메일이 같지 않으면 차단
    if (!lastSentEmail || normEmail(email) !== lastSentEmail) {
      setMsg(
        "코드를 전송한 이메일과 현재 이메일이 달라요. 이메일을 맞춰주세요."
      );
      return;
    }

    try {
      setLoadingVerify(true);

      await publicApi.post("/auth/email/verify", {
        email: normEmail(email), // ✅ 필수
        code: code.trim(), // ✅ 숫자 변환 금지(앞자리 0 보존)
      });

      setIsVerified(true);
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

      // ⚠️ 서버 스펙이 '이메일 인증 후 가입'이라면 verify 완료를 강제하고 싶으면 아래 주석 해제
      // if (!isVerified) {
      //   setMsg("이메일 인증을 완료해 주세요.");
      //   return;
      // }

      const { data } = await publicApi.post<UserDto>("/auth/signup", {
        email: normEmail(email),
        password,
        nickname,
        // 서버가 validCode를 요구한다면 아래도 함께 전송:
        // validCode: Number(code) // (앞자리 0 필요하면 문자열 유지해야 함)
      });

      if (data?.email) {
        // ✅ 가입 성공 → 로그인 페이지로 이동 (+ 배너 표시용 쿼리)
        navigate("/login?signedUp=1", { replace: true });
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
            disabled={isCodeSent && !isVerified}
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
        {loadingSubmit ? "가입 중..." : "회원가입 하기"}
      </button>
    </form>
  );
};

export default SignUpForm;
