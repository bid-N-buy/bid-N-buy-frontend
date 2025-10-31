// features/auth/hooks/useAuthInit.ts
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../store/authStore";
import type {
  LoginResponse,
  ReissueResponse,
  LegacyTokenResponse,
  ReissueRequest,
} from "../../../shared/types/auth";

/** 최신 스펙(tokenInfo) 판별 타입가드 */
function hasTokenInfo(
  d: ReissueResponse | LoginResponse | LegacyTokenResponse
): d is ReissueResponse | LoginResponse {
  return (
    typeof (d as ReissueResponse | LoginResponse).tokenInfo !== "undefined"
  );
}

/** 공개 경로 목록: 필요에 따라 추가/수정 */
const PUBLIC_PREFIXES = [
  "/", // 메인
  "/auctions", // 목록/상세 등 공개
  "/login",
  "/signup",
  "/oauth",
  "/about",
  "/help",
] as const;

function normalizePathname(raw?: string): string {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (
    typeof window !== "undefined" &&
    typeof window.location?.pathname === "string"
  ) {
    return window.location.pathname || "/";
  }
  return "/";
}

function isPublicPath(pathname?: string): boolean {
  const safePath = normalizePathname(pathname);
  return PUBLIC_PREFIXES.some(
    (p) => safePath === p || safePath.startsWith(p + "/")
  );
}

/**
 * Router 훅에 의존하지 않도록 pathname을 인자로 받음 (옵셔널)
 * - 공개 경로에서는 비로그인 시 reissue 호출을 스킵
 * - 보호 경로에서는 refreshToken 없으면 서버 호출 없이 즉시 종료
 * - refreshToken이 있을 때만 reissue 1회 시도
 */
export const useAuthInit = (pathname?: string) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 실제 reissue를 "시도"했는지 (중복 방지)
  const triedRef = useRef(false);

  const safePath = normalizePathname(pathname);
  const isPublic = useMemo(() => isPublicPath(safePath), [safePath]);

  const { refreshToken, setTokens, setProfile, clear } = useAuthStore();

  useEffect(() => {
    // 공개 경로 & 리프레시 없음 → 호출 스킵
    if (!refreshToken && isPublic) {
      setReady(true);
      setError(null);
      return;
    }

    // 보호 경로 & 리프레시 없음 → 서버 호출 없이 종료 (401 스팸 방지)
    if (!refreshToken && !isPublic) {
      clear();
      setError("NO_REFRESH_TOKEN");
      setReady(true);
      return;
    }

    // refreshToken 존재 → reissue 1회
    if (triedRef.current) {
      setReady(true);
      return;
    }
    triedRef.current = true;

    (async () => {
      try {
        const body: ReissueRequest = { refreshToken: refreshToken! };

        const { data } = await api.post<
          ReissueResponse | LoginResponse | LegacyTokenResponse
        >("/auth/reissue", body, { withCredentials: true });

        const newAccess: string | null = hasTokenInfo(data)
          ? data.tokenInfo.accessToken
          : (data.accessToken ?? null);

        const newRefresh: string | null = hasTokenInfo(data)
          ? (data.tokenInfo.refreshToken ?? null)
          : (data.refreshToken ?? null);

        if (!newAccess) {
          clear();
          setError("NO_ACCESS_TOKEN");
          setReady(true);
          return;
        }

        setTokens(newAccess, newRefresh);

        // 응답에 프로필이 있으면 반영 (옵셔널)
        if (hasTokenInfo(data)) {
          const nickname = data.nickname ?? undefined;
          const email = data.email ?? undefined;
          if (nickname || email) {
            setProfile({ nickname: nickname ?? "User", email });
          }
        }

        setError(null);
      } catch {
        clear();
        setError("REISSUE_FAILED");
      } finally {
        setReady(true);
      }
    })();
  }, [isPublic, safePath, refreshToken, clear, setTokens, setProfile]);

  return { ready, error };
};
