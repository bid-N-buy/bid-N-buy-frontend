import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { messaging } from "../../../shared/firebase-config";
import { useNotiStore } from "../store/notiStore";

const FcmListener = () => {
  const addNoti = useNotiStore((s) => s.addNoti);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {

      const { notification, data } = payload;
      if (!data) return;

      // store에 추가
      addNoti({
        notificationId: BigInt(data.notificationId),
        type: data.type,
        content: data.content,
        read: false,
        createdAt: data.createdAt,
        deletedAt: null,
      });
    });

    return () => unsubscribe();
  }, [addNoti]);

  return null;
};

export default FcmListener;
