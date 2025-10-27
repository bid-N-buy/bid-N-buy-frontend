// src/features/mypage/hooks/useProfile.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";

export type ProfileDto = {
  nickname: string;
  email?: string;
  avatarUrl?: string;
  temperature?: number; // 0~100 가정
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
   * 3) 둘 다 없으면 userId ? `/auth/${userId}` : "/mypage"
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

        // axiosInstance 사용. 인터셉터가 자동으로 토큰 붙이겠지만
        // 혹시 인터셉터보다 먼저 실행될 타이밍 대비해서 headers에 한 번 더 넣어줌.
        const res = await api.get(url, {
          signal: ctrl.signal,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        });

        if (!alive) return;

        const raw = res.data ?? {};

        console.log("[useProfile] response from", url, raw);

        // -------------------------------
        // 🔥 온도 매핑 로직 (여기가 핵심 변경점)
        // -------------------------------
        // 서버가 temperature 또는 user_temperature 같은 값을 안 내려주거나
        // null을 내려주는 경우가 있어서 fallbackTemp를 넣어서 보여줄 거야.
        // 이 fallbackTemp는 '일단 화면에 보여줄 기본 신뢰도' 같은 느낌.
        const fallbackTemp = 72.5; // <- 원하는 기본값으로 조정 가능

        // 서버에서 올 법한 키들 전부 훑어서 후보로 사용
        const tempCandidate =
          raw.temperature ??
          raw.user_temperature ??
          raw.userTemperature ??
          raw.userTemperatureScore ??
          raw.userTemp ??
          fallbackTemp;

        // 숫자 변환 + 클램프(0~100)
        let tempNum = Number(tempCandidate);
        if (!Number.isFinite(tempNum)) tempNum = fallbackTemp;
        if (tempNum < 0) tempNum = 0;
        if (tempNum > 100) tempNum = 100;

        const mapped: ProfileDto = {
          nickname: raw.nickname ?? "NickName",
          email: raw.email ?? raw.userEmail ?? "",
          avatarUrl:
            raw.avatarUrl ??
            raw.profileImageUrl ??
            raw.profile_image_url ??
            raw.imageUrl ??
            "",
          temperature: tempNum,
        };

        console.log("[useProfile] mapped profile", mapped);

        setData(mapped);
      } catch (e: any) {
        if (!alive || e?.name === "CanceledError") return;

        // axiosInstance가 401에서 리프레시를 이미 시도할 수 있으므로
        // 여기선 그냥 에러 저장만.
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
