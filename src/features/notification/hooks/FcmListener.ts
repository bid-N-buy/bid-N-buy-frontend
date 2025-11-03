import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "../../../shared/firebase-config";
import { useNotiStore } from "../store/notiStore";

import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";

const FcmListener = () => {
  const addNoti = useNotiStore((s) => s.addNoti);
  const token = useAuthStore((s) => s.accessToken);
  const { makeChatRoomInAuc } = useChatModalStore();

  useEffect(() => {

    console.log("🟢 [FCM Listener] 초기화 완료, 메시지 대기 중...");

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 [FCM 수신됨]:", payload);
      const data = payload.data || {};

      // ✅ 필드 추출 및 BigInt 변환
      const notificationId = data.notificationId ? BigInt(data.notificationId) : BigInt(0);
      const type = data.type || "ALERT";
      const content = payload.notification?.body || data.body || "새 알림이 있습니다.";
      const createdAt = data.createdAt || new Date().toISOString();
      const auctionId = data.auctionId ? BigInt(data.auctionId) : undefined;
      const sellerId = data.sellerId ? BigInt(data.sellerId) : undefined;

      console.log("🧾 [정제된 데이터]:", { notificationId, type, content, auctionId, sellerId, createdAt });

      // 채팅방 생성
      const handleChatAdd = async (auctionId: number, sellerId: number) => {
        if (!token) {
          return;
        }

        try {
          const response = await api.post(
            `/chatrooms/${auctionId}`,
            { sellerId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const chatroomId = response.data.chatroomId;
          await makeChatRoomInAuc(token, sellerId, auctionId);
          // 채팅 모달이 헤더에 종속된 컴포넌트이므로 zustand로 상태 변경
          useChatModalStore.getState().openChatRoom(chatroomId);
        } catch (error) {
          console.log(error);
        }
      };

      // ✅ 알림 클릭 핸들러
      const handleClick = () => {
        console.log("🖱️ [알림 클릭됨]:", data);
        if (data.auctionId && data.sellerId) {
          handleChatAdd(Number(data.auctionId), Number(data.sellerId));
        } else {
          console.warn("⚠️ [FCM] 채팅방 생성 정보 부족:", data);
        }
      };

      console.log("🧩 저장될 알림:", {
        notificationId,
        type,
        content,
        data: {
          ...data, auctionId, sellerId
        },
        onClick: handleClick,
      });

      // Zustand에 저장
      addNoti({
        notificationId,
        type,
        content,
        read: false,
        createdAt,
        deletedAt: null,
        auctionId: auctionId ? Number(auctionId) : undefined, // ✅ bigint → number 변환
        sellerId: sellerId ? Number(sellerId) : undefined,
        onClick: handleClick,
      });
    });



    return () => {
      console.log("🔴 [FCM Listener] 언마운트됨");
      unsubscribe();
    };
  }, [addNoti]);

  return null;
};

declare global {
  interface Window {
    __FCM_LISTENER_ACTIVE__?: boolean;
  }
}

export default FcmListener;
