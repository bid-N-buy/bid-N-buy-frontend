import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import api from "../../../shared/api/axiosInstance";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAdminAuthStore, type AdminState } from "../store/adminStore";
import type { AdminLoginResponse } from "../types/AdminType";
import type { ErrorResponse } from "../../../shared/types/CommonType";

/** (디버그) 간단 JWT payload 디코더 — 검증 X */
const decodeJwt = (jwt?: string | null) => {
  if (!jwt) return null;
  try {
    const [, payload] = jwt.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

/** 응답/토큰에서 AdminId 추출 */
const resolveAdminIdFrom = (accessToken: string | null): number | null => {
  const claims = decodeJwt(accessToken);
  const sub = claims?.sub;
  const aid = claims?.aid ?? claims?.adminId;
  const parsed =
    typeof sub === "number"
      ? sub
      : typeof sub === "string" && /^\d+$/.test(sub)
        ? Number(sub)
        : typeof aid === "number"
          ? aid
          : typeof aid === "string" && /^\d+$/.test(aid)
            ? Number(aid)
            : null;
  return parsed ?? null;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const AdminLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTokens = useAdminAuthStore((s: AdminState) => s.setTokens);
  const navigate = useNavigate();
  const location = useLocation();

  /** (DEV) 스토어 변경 로그 */
  useEffect(() => {
    const unsub = useAdminAuthStore.subscribe((state, prev) => {
      if (import.meta.env.DEV) {
        console.debug("[auth] changed", {
          accessChanged: state.accessToken !== prev.accessToken,
          refreshChanged: state.refreshToken !== prev.refreshToken,
          adminId: state.adminId,
        });
      }
    });
    return unsub;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (loading) return;

      setError(null);

      const emailTrim = email.trim();
      const pwTrim = password.trim();

      if (!emailTrim || !pwTrim) {
        setError("아이디와 비밀번호를 입력해 주세요.");
        return;
      }
      if (!isEmail(emailTrim)) {
        setError("올바른 이메일 형식이 아닙니다.");
        return;
      }
      if (pwTrim.length < 4) {
        setError("비밀번호가 너무 짧습니다.");
        return;
      }

      try {
        setLoading(true);

        const res = await api.post<AdminLoginResponse>(
          "/admin/auth/login",
          { email: emailTrim, password: pwTrim },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        if (import.meta.env.DEV) {
          console.debug("[login] axios response", {
            status: res.status,
            headers: res.headers,
            data: res.data,
          });
        }

        const data = res.data;

        const access = data.accessToken || null;

        const refresh = data.refreshToken || null;

        if (!access) {
          throw new Error(
            "accessToken이 응답에 없습니다. 서버 응답 형식을 확인하세요."
          );
        }

        // const parsedProfile = {
        //   nickname: (data as any).nickname ?? undefined,
        //   email: (data as any).email ?? undefined,
        // };
        // const hasAnyProfile =
        //   typeof parsedProfile.nickname !== "undefined" ||
        //   typeof parsedProfile.email !== "undefined";

        const adminId = resolveAdminIdFrom(access);

        setTokens(
          access,
          refresh ?? null,
          // hasAnyProfile ? parsedProfile : undefined,
          adminId
        );

        if (import.meta.env.DEV) {
          const snap = useAdminAuthStore.getState();
          console.debug("[auth] after login (store)", {
            accessToken: !!snap.accessToken,
            refreshToken: !!snap.refreshToken,
            // profile: snap.profile,
            adminId: snap.adminId,
          });
        }

        const to =
          location.state?.from?.pathname ??
          location.state?.redirect ??
          "/admin";
        navigate(to, { replace: true });
      } catch (err) {
        if (axios.isAxiosError<ErrorResponse>(err)) {
          const msg =
            err.response?.data?.message ??
            (err.response?.status === 401
              ? "아이디 또는 비밀번호가 올바르지 않습니다."
              : "로그인에 실패했습니다.");
          setError(msg);

          if (import.meta.env.DEV) {
            console.error("[login] failed", {
              url: err.config?.url,
              method: err.config?.method,
              status: err.response?.status,
              data: err.response?.data,
            });
          }
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, loading, location.state, navigate, setTokens]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 이메일 */}
      <input
        name="email"
        type="email"
        id="email"
        placeholder="이메일을 입력해 주세요"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="hover:border-purple w-full rounded-md border px-3 py-2"
        disabled={loading}
        autoComplete="email"
        required
      />

      {/* 비밀번호 */}
      <input
        name="password"
        type="password"
        id="password"
        placeholder="비밀번호를 입력해 주세요"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="hover:border-purple w-full rounded-md border px-3 py-2"
        disabled={loading}
        autoComplete="current-password"
        required
        minLength={4}
      />

      {/* 로그인 버튼 */}
      <button
        type="submit"
        disabled={loading}
        className="bg-purple w-full rounded-md py-2 text-white disabled:opacity-60"
        aria-busy={loading}
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {/* 링크 */}
      <div className="mt-[10px] flex justify-center gap-3">
        <Link to="/admin/resetPassword" className="text-sm hover:underline">
          비밀번호 찾기
        </Link>
        <span className="text-g400 text-sm">|</span>
        <Link to="/admin/signup" className="text-sm hover:underline">
          회원가입
        </Link>
      </div>
    </form>
  );
};

export default AdminLoginForm;
