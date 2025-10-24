import { messaging } from "../firebase-config";
import { getToken } from "firebase/messaging";

export const requestFcmToken = async (): Promise<string | null> => {
  try {
    console.log("🔔 알림 권한 요청 중...");
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // VAPID 키는 Firebase 콘솔에서 생성한 공개 키
      const token = await getToken(messaging, {
        vapidKey: "BL8jYH3exgJIwWRlS6rNm15Anq0AQ27VYUJECXEFbvAhR2CE5EpAiEAo66J2CTKHDDgpp2VUyiKMG2573yIGCKU",
      });
      console.log("✅ FCM 토큰 발급 성공:", token);
      return token;
    } else {
      console.warn("❌ 알림 권한 거부됨");
      return null;
    }
  } catch (err) {
    console.error("FCM 토큰 발급 실패:", err);
    return null;
  }
};
