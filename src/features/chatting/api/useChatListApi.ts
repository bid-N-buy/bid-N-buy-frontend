import { useState, useEffect } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatListItemProps } from "../types/ChatType";

export const useChatListApi = () => {
  const [chatList, setChatList] = useState<ChatListItemProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.accessToken);

  // 임시 데이터 로딩 로직
  useEffect(() => {
    if (!token) {
      setError("채팅목록을 불러올 수 없습니다.");
      setIsLoading(false);
      return;
    }

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
    loadChatList();
  }, [token]);

  return { chatList, isLoading, error };
};
