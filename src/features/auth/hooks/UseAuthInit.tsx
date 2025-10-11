// features/auth/hooks/useAuthInit.ts
import { useEffect, useRef, useState } from "react";
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

export const useAuthInit = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triedRef = useRef(false);

  const { refreshToken, setTokens, setProfile, clear } = useAuthStore();

  useEffect(() => {
    if (triedRef.current) return;
    triedRef.current = true;

    (async () => {
      try {
        // 서버는 refreshToken만 요구
        const body: ReissueRequest | undefined = refreshToken
          ? { refreshToken }
          : undefined;

        const { data } = await api.post<
          ReissueResponse | LoginResponse | LegacyTokenResponse
        >("/auth/reissue", body ?? {}, { withCredentials: true });

        // access/refresh 파싱 (신규 스펙 우선)
        const newAccess: string | null = hasTokenInfo(data)
          ? data.tokenInfo.accessToken
          : (data.accessToken ?? null);

        const newRefresh: string | null = hasTokenInfo(data)
          ? (data.tokenInfo.refreshToken ?? null)
          : (data.refreshToken ?? null);

        if (!newAccess) {
          clear();
          setError("NO_ACCESS_TOKEN");
          return;
        }

        setTokens(newAccess, newRefresh);

        // 닉네임/이메일이 응답에 있으면 프로필 반영 (옵셔널 접근)
        if (hasTokenInfo(data)) {
          const nickname = data.nickname ?? undefined;
          const email = data.email ?? undefined;
          if (nickname || email) {
            setProfile({
              nickname: nickname ?? "User",
              email,
            });
          }
        }
      } catch {
        clear();
        setError("REISSUE_FAILED");
      } finally {
        setReady(true);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready, error };
};
