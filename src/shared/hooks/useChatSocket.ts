import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import api from "../api/axiosInstance";
import SockJS from "sockjs-client";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useChatModalStore } from "../store/ChatModalStore";

export const useChatSocket = () => {
  const token = useAuthStore((s) => s.accessToken);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WEBSOCKET_URL),
      connectHeaders: { "Auth-Token": token },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Global WebSocket connected");

        // 서버에 있는 모든 방 구독
        // → 서버가 어떤 방에 내가 속했는지 push 안 해주므로
        //    초기 한 번 /chatrooms/list 불러서 구독 목록 구성
        api
          .get("/chatrooms/list", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            res.data.forEach((room) => {
              client.subscribe(`/topic/chat/room/${room.chatroomId}`, (msg) => {
                const data = JSON.parse(msg.body);
                useChatModalStore.getState().handleNewChatMessage(data);
              });
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
