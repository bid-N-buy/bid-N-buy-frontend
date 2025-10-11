import React, { Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "../features/auth/store/authStore";
import { useAdminStore } from "../features/admin/store/adminStore";
import ProtectedRoute from "../shared/routes/ProtectedRoute";

// 공통
const Header = React.lazy(() => import("../shared/components/Header"));
// const Footer = React.lazy(() => import("../shared/components/Footer"));

const LoginPage = React.lazy(
  () => import("../features/auth/pages/login/LoginPage")
);
const SignUpPage = React.lazy(
  () => import("../features/auth/pages/signUp/SignUpPage")
);
const Main = React.lazy(() => import("../shared/pages/Main"));

// const NotFoundPage = React.lazy(() => import("../shared/pages/NotFoundPage"));
// const ErrorPage = React.lazy(() => import("../shared/pages/ErrorPage"));

// 경매
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

// 마이페이지
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

// 관리자
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
// } - 분리
function GuestOnlyRoute() {
  const token = useAuthStore.getState().token;
  if (token) return <Navigate to="/" replace />;
  return <Outlet />;
}

// 관리자 가드(임의)
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

// 공통 레이아웃
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

export default function App() {
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

              {/* 문의/신고 */}
              <Route path="inquiries" element={<InquiryList />} />
              {/* <Route path="inquiries/:id" element={<InquiryDetail />} /> */}
            </Route>
          </Route>

          {/* 기타 */}
          {/* <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} /> */}
        </Route>

        {/* 관리자 */}
        <Route path="/admin">
          {/* 관리자 로그인/회원가입 */}
          <Route element={<AdminGuestOnlyRoute />}>
            <Route path="login" element={<AdminLoginPage />} />
            <Route path="signup" element={<AdminSignUpPage />} />
          </Route>

          {/* 관리자 페이지 (로그인 필요) */}
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
