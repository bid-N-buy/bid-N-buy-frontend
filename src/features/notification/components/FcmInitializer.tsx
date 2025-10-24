// src/features/notification/FcmInitializer.tsx
import React, { useEffect, useState } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../../../shared/firebase-config"; // firebase 초기화 한 곳
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";

const FcmInitializer = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);

  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    // 로그인 상태일 때만 실행
    if (!accessToken || !userId) return;

    const registerFcm = async () => {
      try {
        console.log("🔍 현재 알림 권한 상태:", Notification.permission);

        // 1. denied → 브라우저 설정에서 직접 허용해야 함
        if (Notification.permission === "denied") {
          console.warn("🚫 알림 권한이 차단됨. 브라우저 설정에서 직접 허용해야 합니다.");
          setBanner("알림 권한이 차단되어 있습니다. 크롬 주소창 왼쪽 🔒 아이콘 → 알림 → 허용으로 바꿔주세요.");
          return;
        }

        // 2. default → 아직 권한 선택 안 함 → 요청하기
        if (Notification.permission === "default") {
          const perm = await Notification.requestPermission();
          console.log("🔔 권한 요청 결과:", perm);
          if (perm !== "granted") {
            setBanner("🚫 알림 권한을 허용하지 않아 토큰을 발급하지 않습니다.");
            return;
          }
        }

        // 3. 권한이 허용된 상태(granted)
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });
        console.log("✅ 발급된 FCM 토큰:", fcmToken);
        if (fcmToken) {
          // 서버로 등록 (중복 insert 방지 위해 백엔드에서 upsert 처리)
          await api.post(
            "notifications/token",
            { token: fcmToken },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          console.log("📩 FCM 토큰 서버 등록 완료");
        }
      } catch (err: any) {
        if (err.response) {
          console.error("📩 서버 응답 에러:", err.response.status, err.response.data);
        } else {
          console.error("📩 클라이언트 에러:", err.message);
        }
      }
    };

    registerFcm();
  }, [accessToken, userId]); // 최초 로그인 시 한 번만 실행됨

  return (
    <>
      {/* 🚩 배너 UI */}
      {banner && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-2 px-4 z-50">
          <span>{banner}</span>
          <button
            className="ml-4 underline"
            onClick={() => setBanner(null)}
          >
            닫기
          </button>
        </div>
      )}
    </>
  );
};

export default FcmInitializer;
