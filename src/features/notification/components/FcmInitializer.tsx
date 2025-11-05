// src/features/notification/FcmInitializer.tsx
import React, { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../../../shared/firebase-config"; // firebase 초기화 한 곳
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import { useAdminAuthStore } from "../../admin/store/adminStore";

const FcmInitializer = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const adminId = useAdminAuthStore((s) => s.adminId);
  const userId = useAuthStore((s) => s.userId);

  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    // 로그인 상태일 때만 실행
    const isUserLoggedIn = accessToken && userId;
    const isAdminLoggedIn = accessToken && adminId;

    if (!isUserLoggedIn && !isAdminLoggedIn) {
      return;
    }

    const registerFcm = async () => {
      try {

        // case 1: 이미 차단됨
        if (Notification.permission === "denied") {
          console.warn(
            "🚫 알림 권한이 차단됨. 브라우저 설정에서 직접 허용해야 합니다."
          );
          setBanner(
            "알림 권한이 차단되어 있습니다. 크롬 주소창 왼쪽 🔒 아이콘 → 알림 → 허용으로 바꿔주세요."
          );
          return;
        }

        // case 2: 아직 선택 안함 → 요청
        if (Notification.permission === "default") {
          const perm = await Notification.requestPermission();

          if (perm !== "granted") {
            // 거부하면 denied와 동일한 메시지
            setBanner(
              "🚫 알림 권한을 허용하지 않아 알림을 받을 수 없습니다. 크롬 주소창 왼쪽 🔒 아이콘 → 알림 → 허용으로 변경해주세요."
            );
            return;
          }
        }

        // case 3: granted
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        if (fcmToken) {
          await api.post(
            "notifications/token",
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }
      } catch (err: any) {
        if (err.response) {
          console.error(
            "📩 서버 응답 에러:",
            err.response.status,
            err.response.data
          );
        } else {
          console.error("📩 클라이언트 에러:", err.message);
        }
      }
    };

    registerFcm();
  }, [accessToken, userId]); // 최초 로그인 시 한 번만 실행됨

  return (
    <>
      {banner && (
        <div className="fixed top-0 left-0 z-50 w-full bg-red-500 px-4 py-2 text-center text-white">
          <span>{banner}</span>
          <button className="ml-4 underline" onClick={() => setBanner(null)}>
            닫기
          </button>
        </div>
      )}
    </>
  );
};

export default FcmInitializer;
