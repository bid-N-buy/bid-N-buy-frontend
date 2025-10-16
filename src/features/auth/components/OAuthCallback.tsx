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

    // 에러쿼리 처리
    const err = url.searchParams.get("error");
    const errDesc = url.searchParams.get("error_description");
    if (err) {
      // 먼저 URL의 쿼리를 지우고
      window.history.replaceState({}, "", "/oauth/callback");
      // 로그인 페이지로
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

    // (선택) userId 추출
    const userId = resolveUserIdFrom(access) ?? undefined;

    // (선택) 서버가 프로필을 쿼리로 주면 함께 저장
    const nickname = url.searchParams.get("nickname") || undefined;
    const email = url.searchParams.get("email") || undefined;
    const profile =
      nickname || email ? { nickname: nickname ?? "", email } : undefined;

    // 1) 토큰 저장
    setTokens(access, refresh ?? null, profile, userId);

    // 2) URL에서 민감정보 제거
    //    (하드 리다이렉트를 쓸 거라 사실 이 줄 없어도 되지만, 방어적으로 한 번 더)
    window.history.replaceState({}, "", "/oauth/callback");

    // 3) 이동: 하드 리다이렉트로 확실히 쿼리 숨기고 로그인 화면으로
    const back = (loc.state as any)?.redirect || "/";
    // 가장 확실한 방법 (새로고침 + 쿼리 완전 제거)
    window.location.replace(back);

    // SPA 내 네비게이션으로 충분하다면 ↓로 바꿔도 됨 (상황에 따라 라우터/가드 타이밍 문제 있을 수 있음)
    // nav(back, { replace: true });
  }, [loc.state, nav, setTokens]);

  return null;
}
