import React from "react";
import { useAuthStore } from "../../features/auth/store/authStore";
import {
  Navigate,
  Outlet,
  useLocation,
  useSearchParams,
} from "react-router-dom";

const GuestOnlyRoute = () => {
  const token = useAuthStore.getState().accessToken;
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (token) {
    // returnTo 있으면 해당 경로로, 없으면 메인으로
    const returnTo = searchParams.get("returnTo");
    const to = returnTo ? decodeURIComponent(returnTo) : "/";
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
};

export default GuestOnlyRoute;
