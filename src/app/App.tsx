import React, { Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAdminAuthStore } from "../features/admin/store/adminStore";
import ProtectedRoute from "../shared/routes/ProtectedRoute";
import GuestOnlyRoute from "../shared/routes/GuestOnlyRoute";
import { useAuthInit } from "../features/auth/hooks/UseAuthInit";

import ProfileSetting from "../features/mypage/components/profile/ProfileSetting";
import ResetPassword from "../features/auth/components/login/ResetPasswordForm";
import MypageLayout from "../features/mypage/pages/MypageLayout";
import PaymentBridge from "../features/payment/pages/PaymentBridge";
import OAuthCallback from "../features/auth/components/OAuthCallback";
import ProfileDetailsContainer from "../features/mypage/pages/ProfileDetailsContainer";
import InquiryReportForm from "../features/mypage/components/support/InquiryReportForm";
import AdminAsideMenu from "../features/admin/components/AdminAsideMenu";
import InquiryDetailPage from "../features/mypage/pages/InquiryDetailPage";
import NotificationTestPage from "../features/notification/pages/NotificationTestPage";
import FcmInitializer from "../features/notification/components/FcmInitializer";
import FcmListener from "../features/notification/hooks/FcmListener";

// 공통
const Header = React.lazy(() => import("../shared/components/Header"));
const Footer = React.lazy(() => import("../shared/components/Footer"));


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

// 관리자 가드(임의) - 에러로 약간 수정
function AdminProtectedRoute() {
  const adminToken = useAdminAuthStore.getState().accessToken;
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
function AdminGuestOnlyRoute() {
  const adminToken = useAdminAuthStore.getState().accessToken;
  if (adminToken) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

// 공통 레이아웃
function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      {/* 로그인 상태 감지 후 FCM 등록 */}
      <FcmInitializer />
      {/* 포그라운드 알림 수신 */}
      <FcmListener />
      <Suspense fallback={<div className="p-6">로딩 중…</div>}>
        <Header />
      </Suspense>
      <main className="container">
        <Outlet />
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-white">
      <main className="relative flex">
        <AdminAsideMenu />
        <Outlet />
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default function App() {
  const { ready } = useAuthInit();
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
            <Route path="/resetPassword" element={<ResetPassword />} />
          </Route>
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* 경매 */}
          <Route path="/auctions">
            <Route index element={<AuctionList />} />
            <Route path=":id" element={<AuctionDetail />} />
            <Route element={<ProtectedRoute />}>
              <Route path="new" element={<AuctionForm />} />
            </Route>
          </Route>

          {/* 결제 관련 */}
          <Route path="/payment/bridge" element={<PaymentBridge />} />
          <Route path="/notice" element={<NotificationTestPage />} />

          {/* 마이페이지 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mypage" element={<MypageLayout />}>
              <Route index element={<MyPageMain />} />
              <Route path="purchases" element={<PurchaseList />} />
              <Route path="sales" element={<SaleList />} />
              <Route path="wishlist" element={<WishList />} />
              <Route path="account" element={<AccountSettings />} />
              {/* <Route path="profile" element={<ProfileDetails />} /> */}
              <Route path="profile/settings" element={<ProfileSetting />} />

              {/* 문의/신고 */}
              <Route path="inquiries" element={<InquiryList />} />

              {/* ✅ 문의/신고 작성 (상대 경로로 묶기) */}
              <Route path="support">
                {/* /mypage/support -> /mypage/support/inquiries/new 로 리디렉트 */}
                <Route
                  index
                  element={<Navigate to="inquiries/new" replace />}
                />
                <Route path="inquiries/new" element={<InquiryReportForm />} />
                <Route path="reports/new" element={<InquiryReportForm />} />
                <Route path="inquiries/:id" element={<InquiryDetailPage />} />
              </Route>

              {/* <Route path="inquiries/:id" element={<InquiryDetail />} /> */}
            </Route>
            <Route path="/profile" element={<ProfileDetailsContainer />} />
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
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="inquiries" element={<AdminInquiryList />} />
              <Route path="users" element={<AdminUserList />} />
              <Route path="auctions" element={<AdminAuctionList />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
