import { useState, useEffect } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatListItemProps } from "../types/ChatType";

export const useChatListApi = (isChatOpen: boolean) => {
  const [chatList, setChatList] = useState<ChatListItemProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.accessToken);

  const loadChatList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<ChatListItemProps[]>("/chatrooms/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChatList(response.data);
    } catch (error) {
      console.error("Failed to load chat rooms:", error);
      setError(`채팅 목록을 불러올 수 없습니다: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && isChatOpen) {
      loadChatList();
    } else if (!isChatOpen) {
      setIsLoading(false);
      return;
    }
  }, [token, isChatOpen]);

  return { chatList, isLoading, error, refetchList: loadChatList };
};
