import React from "react";
import { useAuthStore } from "../../features/auth/store/authStore";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  // 1) getState() ❌ -> hook으로 구독해야 리렌더 됨
  const refreshToken = useAuthStore((s) => s.refreshToken);

  // 2) persist 하이드레이션 완료 여부 확인 (zustand/persist 사용 시)
  const hasHydrated = (useAuthStore as any).persist?.hasHydrated?.() ?? true;

  const location = useLocation();

  // 3) 하이드레이션 전에는 판단하지 말고 로딩 표시
  if (!hasHydrated) {
    return <div className="p-6 text-center">로그인 상태 확인 중…</div>;
  }

  // 4) 토큰 없으면 로그인으로 이동하되, 돌아올 경로를 함께 저장
  if (!refreshToken) {
    const returnTo = encodeURIComponent(
      location.pathname + location.search + location.hash
    );
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
