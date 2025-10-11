import React from "react";
import { useAuthStore } from "../../features/auth/store/authStore";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = useAuthStore.getState().accessToken;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
