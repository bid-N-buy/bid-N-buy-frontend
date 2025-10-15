// // routes/OAuthCallback.tsx
// import { useEffect } from "react";
// import { useAuthStore } from "@/features/auth/store/authStore";

// export default function OAuthCallback() {
//   const { setToken } = useAuthStore();

//   useEffect(() => {
//     const url = new URL(window.location.href);
//     const token = url.searchParams.get("token");
//     if (token) {
//       setToken(token);
//       // 쿼리 제거 후 홈으로
//       window.location.replace("/");
//     } else {
//       // 에러/취소 처리 등
//       window.location.replace("/login?error=social");
//     }
//   }, [setToken]);

//   return null;
// }