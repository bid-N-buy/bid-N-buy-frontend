import { useState, useEffect } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatRoomProps } from "../types/ChatType";

export const useChatApi = () => {
  // list에 더이 데이터 표시
  const [chatRooms, setChatRooms] = useState<ChatRoomProps[]>([]);
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
        const response = await api.get<ChatRoomProps[]>("/chatrooms/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setChatRooms(response.data);
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
        setError(`채팅 목록을 불러올 수 없습니다: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadChatList();
  }, [token]);

  return { chatRooms, isLoading, error };
};
