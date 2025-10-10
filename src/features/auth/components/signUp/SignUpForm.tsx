import React, { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:4000",
  withCredentials: true,
  timeout: 10_000,
});

const SignUpForm = () => {
  // form
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [nickname, setNickname] = useState("");

  // (선택 UX) 이메일 중복/코드 인증 단계 상태 — 제출을 막지는 않음
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

  // 이메일 변경 시 인증 단계 초기화(제출은 여전히 가능)
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

  // (선택) 이메일 중복확인 — 결과만 표시, 제출 차단 X
  const checkEmail = async () => {
    setMsg(null);
    try {
      setLoadingCheck(true);
      const { data } = await api.get("/auth/email/check", {
        params: { email },
      }); // { available: boolean }
      setIsEmailChecked(!!data?.available);
      if (!data?.available) setMsg("이미 사용중인 이메일입니다.");
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setIsEmailChecked(null);
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "이메일 확인에 실패했습니다."
      );
    } finally {
      setLoadingCheck(false);
    }
  };

  // (선택) 코드 전송/인증 — 결과만 표시, 제출 차단 X
  const sendCode = async () => {
    setMsg(null);
    try {
      setLoadingSend(true);
      await api.post("/auth/email/send", { email });
      setIsCodeSent(true);
      setLeftSec(600);
      setMsg("인증코드를 전송했어요. 메일함을 확인하세요.");
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "코드 전송에 실패했습니다."
      );
    } finally {
      setLoadingSend(false);
    }
  };

  const verifyCode = async () => {
    setMsg(null);
    try {
      setLoadingVerify(true);
      const { data } = await api.post("/auth/email/verify", { email, code }); // { ok: boolean }
      setIsVerified(!!data?.ok);
      setMsg(
        data?.ok
          ? "이메일 인증 완료되었습니다. ✅"
          : "인증 실패: 코드가 틀리거나 만료되었습니다."
      );
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setIsVerified(false);
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "인증에 실패했습니다."
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  // 제출: **프론트 검증 없음** — 서버 판정에 전부 위임
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    try {
      setLoadingSubmit(true);
      // 백엔드 매핑에 맞춰 /signup 사용 (성공: UserDto, 실패: { error }/예외)
      const { data } = await api.post("/signup", { email, password, nickname });

      // 성공: UserDto 형태(email, nickname)
      if (data?.email) {
        setMsg("회원가입이 완료되었습니다.");
        // window.location.href = "/login";
      } else {
        // 혹시 다른 포맷(예: { ok:false, message })도 커버
        setMsg(data?.message ?? "회원가입 처리에 실패하였습니다.");
      }
    } catch (e) {
      const err = e as AxiosError<{ message?: string; error?: string }>;
      setMsg(
        err.response?.data?.message ??
          err.response?.data?.error ??
          "회원가입에 실패했습니다."
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <>
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
    </>
  );
};

export default SignUpForm;
