// src/features/notification/FcmInitializer.tsx
import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../../../shared/firebase-config"; // firebase 초기화 한 곳
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";

const FcmInitializer = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    // 로그인 상태일 때만 실행
    if (!accessToken || !userId) return;

    const registerFcm = async () => {
      try {
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (fcmToken) {
          // 서버로 등록 (중복 insert 방지 위해 백엔드에서 upsert 처리)
          await api.post(
            "notifications/token",
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          console.log("📩 FCM 토큰 서버 등록 완료");
        }
      } catch (err) {
        console.error("📩 FCM 토큰 등록 실패:", err);
      }
    };

    registerFcm();
  }, [accessToken, userId]); // 최초 로그인 시 한 번만 실행됨

  return null;
};

export default FcmInitializer;
