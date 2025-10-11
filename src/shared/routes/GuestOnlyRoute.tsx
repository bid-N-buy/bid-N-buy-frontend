import React from "react";
import { useAuthStore } from "../../features/auth/store/authStore";
import { Navigate, Outlet } from "react-router-dom";

const GuestOnlyRoute = () => {
  const token = useAuthStore.getState().accessToken;
  if (token) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default GuestOnlyRoute;
