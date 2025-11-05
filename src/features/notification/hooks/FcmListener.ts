import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "../../../shared/firebase-config";
import { useNotiStore } from "../store/notiStore";

import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";

const FcmListener = () => {
  const addNoti = useNotiStore((s) => s.addNoti);
  const token = useAuthStore((s) => s.accessToken);
  const { makeChatRoomInAuc, openChatRoom } = useChatModalStore();

  useEffect(() => {

    const unsubscribe = onMessage(messaging, async (payload) => {

      const data = payload.data || {};

      const notificationId = data.notificationId ? BigInt(data.notificationId) : BigInt(0);
      const type = data.type || "ALERT";
      const content = data.body || payload.notification?.body || "새 알림이 있습니다.";
      const createdAt = data.createdAt || new Date().toISOString();
      const auctionId = data.auctionId ? Number(data.auctionId) : undefined;
      const sellerId = data.sellerId ? Number(data.sellerId) : undefined;


      // ✅ Zustand에 알림 저장 (onClick 제외)
      addNoti({
        notificationId,
        type,
        content,
        read: false,
        createdAt,
        deletedAt: null,
        auctionId,
        sellerId,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [addNoti, token, makeChatRoomInAuc, openChatRoom]);

  return null;
};

export default FcmListener;
