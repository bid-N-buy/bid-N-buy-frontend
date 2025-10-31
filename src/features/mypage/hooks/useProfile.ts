import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";

export type ProfileDto = {
  nickname: string;
  email?: string;
  avatarUrl?: string;
  temperature?: number | null; // 0~100 or null
};

type Options = {
  enabled?: boolean; // 외부에서 페치 on/off 제어
  /**
   * URL 지정 방법
   * - string: 고정 엔드포인트 사용 (예: "/mypage")
   * - function: userId를 받아 동적 엔드포인트 생성 (예: id => `/auth/${id}/profile`)
   * - 미지정: userId 없으면 "/mypage" (기본), userId 있으면 `/auth/${userId}`
   */
  endpoint?: string | ((userId: string | number) => string);
};

export function useProfile(userId?: number | string, opts: Options = {}) {
  const { enabled = true, endpoint } = opts;

  // Zustand persist 여부와 상관없이 안전 가드
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydratedSafe =
    (useAuthStore as any).persist?.hasHydrated?.() ?? true;

  /**
   * 실제로 호출할 URL 계산
   *
   * 우선순위:
   * 1) endpoint가 문자열이면 그대로 사용
   * 2) endpoint가 함수면 userId를 넣어서 사용 (userId 없으면 "/mypage")
   * 3) 둘 다 없으면 userId ? `/auth/${userId}` : "/mypage`
   */
  const url = useMemo(() => {
    if (typeof endpoint === "string") return endpoint;
    if (typeof endpoint === "function") {
      if (userId === undefined || userId === null) return "/mypage";
      return endpoint(userId);
    }
    return userId ? `/auth/${userId}` : `/mypage`;
  }, [endpoint, userId]);

  // 실제로 요청할지 여부
  const shouldFetch = enabled && hasHydratedSafe;

  const [data, setData] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState<boolean>(shouldFetch);
  const [error, setError] = useState<unknown>(null);

  // refetch용 tick
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(url, {
          signal: ctrl.signal,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        });

        if (!alive) return;

        const raw = res.data ?? {};

        // ---- 온도 처리 (fallback 제거 버전) ----
        // 서버가 그냥 null 주면 그대로 null로 둔다.
        // 절대 임의로 72.5 같은 기본값을 넣지 않는다.
        const rawTempCandidate =
          raw.temperature ??
          raw.user_temperature ??
          raw.userTemperature ??
          raw.userTemperatureScore ??
          raw.userTemp ??
          null;

        let tempNum: number | null = Number(rawTempCandidate);
        if (!Number.isFinite(tempNum)) {
          tempNum = null;
        } else {
          if (tempNum < 0) tempNum = 0;
          if (tempNum > 100) tempNum = 100;
        }

        const mapped: ProfileDto = {
          nickname: raw.nickname ?? "NickName",
          email: raw.email ?? raw.userEmail ?? "",
          avatarUrl:
            raw.avatarUrl ??
            raw.profileImageUrl ??
            raw.profile_image_url ??
            raw.imageUrl ??
            "",
          temperature: tempNum, // now can be null
        };

        setData(mapped);
      } catch (e: any) {
        if (!alive || e?.name === "CanceledError") return;

        setError(
          e?.response?.status
            ? {
                status: e.response.status,
                message: e.response?.data?.message ?? "요청 실패",
              }
            : e
        );
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [shouldFetch, url, accessToken, tick]);

  return { data, loading, error, refetch };
}
