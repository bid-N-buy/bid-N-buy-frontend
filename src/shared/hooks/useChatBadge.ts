import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import api from "../api/axiosInstance";
import SockJS from "sockjs-client";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useChatModalStore } from "../store/ChatModalStore";
import type { ChatListItemProps } from "../../features/chatting/types/ChatType";

export const useChatBadge = () => {
  const token = useAuthStore((s) => s.accessToken);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WEBSOCKET_URL),
      connectHeaders: { "Auth-Token": token },
      reconnectDelay: 5000,
      onStompError: (frame) => {
        console.error("❌ STOMP 에러 발생:", frame);
      },
      onWebSocketError: (error) => {
        console.error("❌ WebSocket 연결 에러 발생:", error);
      },
      onConnect: () => {
        try {
          api
            .get<ChatListItemProps[]>("/chatrooms/list", {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
              console.log(res.data);
              res.data
                .filter(
                  (chatRoom) =>
                    chatRoom.counterpartNickname !== "탈퇴회원" &&
                    !!chatRoom.chatroomId
                )
                .forEach((chatRoom) => {
                  client.subscribe(
                    `/topic/chat/room/${chatRoom.chatroomId}`,
                    (msg) => {
                      const data = JSON.parse(msg.body);
                      useChatModalStore.getState().handleNewChatMessage(data);
                    }
                  );
                });
            })
            .catch((error) => {
              console.error("채팅방 목록 조회 중 오류 발생:", error);
            });
        } catch (e) {
          console.error("웹소켓 구독 로직 중 심각한 오류 발생:", e);
        }
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
