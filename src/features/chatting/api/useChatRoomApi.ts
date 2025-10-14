import { useState, useEffect } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatRoomProps, ChatListProps } from "../types/ChatType";

export const useChatRoomApi = (chatroomId: string) => {
  const [chatRoom, setChatRoom] = useState<ChatRoomProps[]>([]);
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

    const loadChatRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get("/chatrooms/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { counterpartId, auctionId } = response.data;

        // 3. [병렬 요청]: 상대방 정보와 상품 정보 동시에 요청
        const [opponentRes, auctionRes] = await Promise.all([
          // API 2: 상대방 정보
          api.get(`/auth/${counterpartId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          // API 3: 상품 정보
          api.get(`/auctions/${auctionId}`),
        ]);
        setChatRoom({
          counterpartId,
        });
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
        setError(`채팅 목록을 불러올 수 없습니다: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadChatRoom();
  }, [token]);

  return { chatRoom, isLoading, error };
};
