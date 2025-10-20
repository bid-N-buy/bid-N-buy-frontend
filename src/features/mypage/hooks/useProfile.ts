// src/features/mypage/hooks/useProfile.ts
import { useCallback, useEffect, useState } from "react";
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

  // ✅ 하이드레이션/토큰 준비 확인
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = (useAuthStore as any).persist?.hasHydrated?.() ?? true;

  // ✅ 요청 URL 결정을 함수로 뽑기
  const resolveUrl = (): string => {
    if (typeof endpoint === "string") return endpoint;
    if (typeof endpoint === "function") return endpoint(userId!);
    // endpoint 미지정 시 기본값:
    // - userId 없으면 현재 로그인 사용자용 "/mypage"
    // - userId 있으면 백업 경로로 "/auth/{userId}"
    return userId ? `/auth/${userId}` : `/mypage`;
  };

  // ✅ 실제로 요청 보낼지 결정 (userId 없어도 /mypage는 가능해야 함)
  const shouldFetch = enabled && hasHydrated;

  const [data, setData] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState<boolean>(shouldFetch);
  const [error, setError] = useState<unknown>(null);

  // refetch 트리거
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

        const url = resolveUrl();

        const res = await api.get(url, {
          signal: ctrl.signal,
          // 4xx는 catch로 던지되, 401/403은 인터셉터 충돌 없이 표시만
          validateStatus: (s) => s >= 200 && s < 500,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        });

        if (!alive) return;

        if (res.status === 401 || res.status === 403) {
          setError({ status: res.status, message: "세션 만료 또는 권한 없음" });
          setData(null);
          return;
        }

        const d = res.data ?? {};
        // 🔁 키 매핑: /mypage 명세 우선 + 백업 키들 허용
        const mapped: ProfileDto = {
          nickname: d.nickname ?? "NickName",
          email: d.email ?? "",
          avatarUrl:
            d.profileImageUrl ?? d.imageUrl ?? d.profile_image_url ?? "",
          temperature:
            typeof d.temperature === "number" && Number.isFinite(d.temperature)
              ? d.temperature
              : 0, // null/NaN 방어: 0으로 보정
        };

        setData(mapped);
      } catch (e: any) {
        if (!alive || e?.name === "CanceledError") return;
        setError(e);
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enabled, hasHydrated, accessToken, tick, endpoint]);

  return { data, loading, error, refetch };
}
