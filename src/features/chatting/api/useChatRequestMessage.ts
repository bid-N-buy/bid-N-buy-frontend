import { useState, useEffect } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatRoomProps } from "../types/ChatType";
import type { AuctionResponse } from "../../auction/types/product";

export const useChatRequestMessage = (
  paymentId: number,
  productId: number,
  sellerId: number
) => {
  const [chatRoom, setChatRoom] = useState<ChatRoomProps>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.accessToken);

  // 임시 데이터 로딩 로직
  useEffect(() => {
    if (!token || !paymentId) {
      setError("채팅방을 불러올 수 없습니다.");
      setIsLoading(false);
      return;
    }

    const loadChatRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.post("/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          productId,
          sellerId,
        });

        const auctionRes = await api.get<AuctionResponse>(
          `/auctions/${listItem!.auctionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const fullRoomData = {
          paymentId: paymentId,
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
  }, [token, paymentId]);

  return { chatRoom, isLoading, error };
};
