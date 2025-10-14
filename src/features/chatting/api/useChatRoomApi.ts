import { useState, useEffect } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatRoomProps, ChatListItemProps } from "../types/ChatType";

export const useChatRoomApi = (chatroomId: string) => {
  const [chatRoom, setChatRoom] = useState<ChatRoomProps>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.accessToken);

  // 임시 데이터 로딩 로직
  useEffect(() => {
    if (!token || !chatroomId) {
      setError("채팅방을 불러올 수 없습니다.");
      setIsLoading(false);
      return;
    }

    const loadChatRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<ChatListItemProps[]>("/chatrooms/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const listItem = response.data.find(
          (item) => item.chatroomId === chatroomId
        );

        const auctionRes = await api.get(`/auctions/${listItem!.auctionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fullRoomData = {
          chatroomId: chatroomId,
          chatroomInfo: listItem!,
          productInfo: {
            currentPrice: auctionRes.data.currentPrice,
            sellingStatus: auctionRes.data.sellingStatus,
          },
        };

        setChatRoom(fullRoomData);
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
        setError(`채팅방을 불러올 수 없습니다: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadChatRoom();
  }, [token, chatroomId]);

  return { chatRoom, isLoading, error };
};
