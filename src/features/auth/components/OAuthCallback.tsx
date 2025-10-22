// src/features/auth/components/OAuthCallback.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const decodeJwt = (jwt?: string | null) => {
  if (!jwt) return null;
  try {
    const [, p] = jwt.split(".");
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

const resolveUserIdFrom = (access?: string | null): number | null => {
  const c = decodeJwt(access);
  const raw = c?.sub ?? c?.uid ?? c?.userId;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return null;
};

export default function OAuthCallback() {
  const nav = useNavigate();
  const loc = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    const url = new URL(window.location.href);

    // 에러 처리
    const err = url.searchParams.get("error");
    const errDesc = url.searchParams.get("error_description");
    if (err) {
      window.history.replaceState({}, "", "/oauth/callback");
      nav("/login", {
        replace: true,
        state: { error: errDesc || "소셜 로그인 실패" },
      });
      return;
    }

    const access = url.searchParams.get("accessToken");
    const refresh = url.searchParams.get("refreshToken");
    if (!access) {
      window.history.replaceState({}, "", "/oauth/callback");
      nav("/login", { replace: true, state: { error: "토큰이 없습니다." } });
      return;
    }

    const userId = resolveUserIdFrom(access) ?? undefined;
    const nickname = url.searchParams.get("nickname") || undefined;
    const email = url.searchParams.get("email") || undefined;
    const profile =
      nickname || email ? { nickname: nickname ?? "", email } : undefined;

    // 1) 토큰 저장 (persist에 기록)
    setTokens(access, refresh ?? null, profile, userId);

    // 2) 콜백 URL 정리(민감 쿼리 제거)
    window.history.replaceState({}, "", "/oauth/callback");

    // 3) SPA 네비게이션 (하드 리다이렉트 사용 금지)
    const back = (loc.state as any)?.redirect || "/";
    nav(back, { replace: true });
  }, [loc.state, nav, setTokens]);

  return null;
}
