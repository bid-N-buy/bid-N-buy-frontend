// src/features/auth/pages/KakaoCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import api from "../../../../shared/api/axiosInstance";
import { useAuthStore, type AuthState } from "../../store/authStore";

const KakaoCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s: AuthState) => s.setTokens);
  const setProfile = useAuthStore((s: AuthState) => s.setProfile);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) {
      setError("인가 코드가 없습니다.");
      return;
    }

    (async () => {
      try {
        // 서버에 인가코드 전달 → 질문에 주신 JSON 구조로 응답한다고 가정
        const { data } = await api.get("/auth/kakao", { params: { code } });
        // data: { email, nickname, tokenInfo: { accessToken, refreshToken, ... } }

        const access = data?.tokenInfo?.accessToken ?? null;
        const refresh = data?.tokenInfo?.refreshToken ?? null;
        if (!access) throw new Error("accessToken이 없습니다.");

        // 프로필/토큰 저장
        if (data?.nickname || data?.email) {
          setProfile({ nickname: data.nickname, email: data.email });
        }
        setTokens(access, refresh);

        // 이전 페이지로 복귀 (state에 저장해뒀다면 우선 사용)
        const backTo = (location.state as any)?.from ?? "/";
        navigate(backTo, { replace: true });
      } catch (e) {
        if (axios.isAxiosError(e)) {
          setError(
            e.response?.data ?? "카카오 로그인 처리 중 오류가 발생했습니다."
          );
        } else if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("알 수 없는 오류");
        }
      }
    })();
  }, [navigate, location.state, setProfile, setTokens]);

  if (error) return <p className="text-red-500">{error}</p>;
  return <p className="text-sm text-neutral-500">카카오 로그인 처리 중…</p>;
};

export default KakaoCallback;
