window.global = window;
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";

import { useAuthStore, type AuthState } from "./features/auth/store/authStore";

// 부팅 로그 (전역 코드 실행 확인용)
console.log("[BOOT] main loaded");

// ✅ 전역 구독 (단일 리스너 형태: 모든 상태 변경 시 호출)
// 필요하면 아래에서 access/refresh 변경만 골라 로그하도록 분기
let lastAccess: string | null = null;
let lastRefresh: string | null = null;

useAuthStore.subscribe((state: AuthState) => {
  if (state.accessToken !== lastAccess || state.refreshToken !== lastRefresh) {
    console.log(
      "[auth] access:",
      state.accessToken,
      "| refresh:",
      state.refreshToken
    );
    lastAccess = state.accessToken;
    lastRefresh = state.refreshToken;
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
