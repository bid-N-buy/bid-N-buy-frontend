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

    const fetchChatList = async () => {
      const res = await api.get<ChatListItemProps[]>("/chatrooms/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    };

    const validRooms = async (
      chatRooms: ChatListItemProps[],
      client: Client
    ) => {
      chatRooms
        .filter(
          (chatRoom) =>
            chatRoom.counterpartNickname !== "탈퇴회원" && !!chatRoom.chatroomId
        )
        .forEach((chatRoom) => {
          client.subscribe(`/topic/chat/room/${chatRoom.chatroomId}`, (msg) => {
            const data = JSON.parse(msg.body);
            useChatModalStore.getState().handleNewChatMessage(data);
          });
        });
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WEBSOCKET_URL),
      connectHeaders: { "Auth-Token": token },
      reconnectDelay: 5000,
      onStompError: (frame) => {
        console.error("STOMP 에러 발생:", frame);
      },
      onWebSocketError: (error) => {
        console.error("WebSocket 연결 에러 발생:", error);
      },
      onConnect: async () => {
        try {
          const rooms = await fetchChatList();
          validRooms(rooms, client);
        } catch (error) {
          console.error("채팅 연결 프로세스 중 오류:", error);
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
