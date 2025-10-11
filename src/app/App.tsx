// src/app/App.tsx
import React, { Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuthInit } from "../features/auth/hooks/UseAuthInit"; // ✅ 추가된 부분
import { useAuthStore } from "../features/auth/store/authStore";
import { useAdminStore } from "../features/admin/store/adminStore";
// import ProtectedRoute from "../shared/routes/ProtectedRoute";

// ────────────────────────────────
// 공통
// ────────────────────────────────
const Header = React.lazy(() => import("../shared/components/Header"));
// const Footer = React.lazy(() => import("../shared/components/Footer"));
const Main = React.lazy(() => import("../shared/pages/Main"));

// ────────────────────────────────
// 인증 관련
// ────────────────────────────────
const LoginPage = React.lazy(
  () => import("../features/auth/pages/login/LoginPage")
);
const SignUpPage = React.lazy(
  () => import("../features/auth/pages/signUp/SignUpPage")
);

// ────────────────────────────────
// 경매
// ────────────────────────────────
const AuctionList = React.lazy(
  () => import("../features/auction/pages/AuctionList")
);
const AuctionDetail = React.lazy(
  () => import("../features/auction/pages/AuctionDetail")
);
const AuctionForm = React.lazy(
  () => import("../features/auction/pages/AuctionForm")
);
const AuctionEdit = React.lazy(
  () => import("../features/auction/pages/AuctionForm")
); // 재사용

// ────────────────────────────────
// 마이페이지
// ────────────────────────────────
const MyPageMain = React.lazy(
  () => import("../features/mypage/pages/MyPageMain")
);
const AccountSettings = React.lazy(
  () => import("../features/mypage/pages/AccountSettings")
);
const InquiryList = React.lazy(
  () => import("../features/mypage/pages/InquiryList")
);
const PurchaseList = React.lazy(
  () => import("../features/mypage/pages/PurchaseList")
);
const SaleList = React.lazy(() => import("../features/mypage/pages/SaleList"));
const WishList = React.lazy(() => import("../features/mypage/pages/WishList"));

// ────────────────────────────────
// 관리자
// ────────────────────────────────
const AdminLoginPage = React.lazy(
  () => import("../features/admin/pages/AdminLoginPage")
);
const AdminSignUpPage = React.lazy(
  () => import("../features/admin/pages/AdminSignUpPage")
);
const AdminDashboard = React.lazy(
  () => import("../features/admin/pages/AdminDashboard")
);
const AdminInquiryList = React.lazy(
  () => import("../features/admin/pages/AdminInquiryList")
);
const AdminUserList = React.lazy(
  () => import("../features/admin/pages/AdminUserList")
);
const AdminAuctionList = React.lazy(
  () => import("../features/admin/pages/AdminAuctionList")
);

// 라우트 가드(임의)
// function ProtectedRoute() {
//   const token = useAuthStore.getState().token;
//   if (!token) return <Navigate to="/login" replace />;
//   return <Outlet />;
// }
// ────────────────────────────────
// 라우트 가드
// ────────────────────────────────
function ProtectedRoute() {
  const token = useAuthStore.getState().accessToken;
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestOnlyRoute() {
  const token = useAuthStore.getState().accessToken;
  if (token) return <Navigate to="/" replace />;
  return <Outlet />;
}

function AdminProtectedRoute() {
  const adminToken = useAdminStore.getState().token;
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

function AdminGuestOnlyRoute() {
  const adminToken = useAdminStore.getState().token;
  if (adminToken) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

// ────────────────────────────────
// 공통 레이아웃
// ────────────────────────────────
function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="p-6">로딩 중…</div>}>
        <Header />
      </Suspense>
      <main className="container">
        <Outlet />
      </main>
      <Suspense fallback={null}>{/* <Footer /> */}</Suspense>
    </div>
  );
}

// ────────────────────────────────
// 메인 App
// ────────────────────────────────
export default function App() {
  // ✅ 새로고침 후 토큰 재발급 or 쿠키 검증용 초기화 훅
  const { ready } = useAuthInit();

  // 초기화 중이면 로딩 화면
  if (!ready) return <div className="p-6 text-center">초기화 중...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 레이아웃 */}
        <Route element={<AppLayout />}>
          <Route index element={<Main />} />

          {/* 로그인/회원가입 */}
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
          </Route>

          {/* 경매 */}
          <Route path="/auctions">
            <Route index element={<AuctionList />} />
            <Route path=":id" element={<AuctionDetail />} />
            <Route element={<ProtectedRoute />}>
              <Route path="new" element={<AuctionForm />} />
              <Route path=":id/edit" element={<AuctionEdit />} />
            </Route>
          </Route>

          {/* 마이페이지 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mypage">
              <Route index element={<MyPageMain />} />
              <Route path="purchases" element={<PurchaseList />} />
              <Route path="sales" element={<SaleList />} />
              <Route path="wishlist" element={<WishList />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="inquiries" element={<InquiryList />} />
            </Route>
          </Route>
        </Route>

        {/* 관리자 */}
        <Route path="/admin">
          <Route element={<AdminGuestOnlyRoute />}>
            <Route path="login" element={<AdminLoginPage />} />
            <Route path="signup" element={<AdminSignUpPage />} />
          </Route>

          <Route element={<AdminProtectedRoute />}>
            <Route index element={<AdminDashboard />} />
            <Route path="inquiries" element={<AdminInquiryList />} />
            <Route path="users" element={<AdminUserList />} />
            <Route path="auctions" element={<AdminAuctionList />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
