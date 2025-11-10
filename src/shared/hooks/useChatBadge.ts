import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import api from "../api/axiosInstance";
import SockJS from "sockjs-client";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useChatModalStore } from "../store/ChatModalStore";
import type { ChatListItemProps } from "../../features/chatting/types/ChatType";

export const useChatBadge = () => {
  const token = useAuthStore((s) => s.accessToken);
  // const totalUnreadCount = useChatModalStore((s) => s.totalUnreadCount);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WEBSOCKET_URL),
      connectHeaders: { "Auth-Token": token },
      reconnectDelay: 5000,
      onConnect: () => {
        // 서버에 있는 모든 방 구독
        // 서버가 어떤 방에 내가 속했는지 push 안 해주므로 구독 목록 구성
        api
          .get<ChatListItemProps[]>("/chatrooms/list", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            // room 부분 수정했으므로 배포 후 다시 볼 것
            res.data.forEach((chatRoom) => {
              client.subscribe(
                `/topic/chat/room/${chatRoom.chatroomId}`,
                (msg) => {
                  const data = JSON.parse(msg.body);
                  useChatModalStore.getState().handleNewChatMessage(data);
                }
              );
            });
          });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [token]);
};
