import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import type { ChatListItemProps, ChatRoomProps } from "../types/ChatType";

export const useChatRoomData = (chatroomId: number) => {
  const token = useAuthStore((s) => s.accessToken);
  const isChatOpen = useChatModalStore((s) => s.isChatOpen);

  const [chatRoomData, setChatRoomData] = useState<ChatRoomProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !chatroomId || !isChatOpen) {
      setChatRoomData(null);
      return;
    }

    const fetchRoomData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const listResponse = await api.get(`/chatrooms/list`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status >= 200 && status < 500,
        });

        const listItem = listResponse.data.find(
          (item: ChatListItemProps) => item.chatroomId === chatroomId
        );

        if (!listItem) {
          throw new Error("CHAT_ROOM_NOT_FOUND");
        }

        const auctionRes = await api.get(`/auctions/${listItem.auctionId}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status >= 200 && status < 500,
        });

        if (!auctionRes) {
          throw new Error("AUCTION_NOT_FOUND");
        }

        const fullRoomData: ChatRoomProps = {
          chatroomId: chatroomId,
          sellerId: auctionRes.data.sellerId,
          chatroomInfo: {
            auctionId: listItem.auctionId,
            auctionImageUrl: listItem.auctionImageUrl,
            auctionTitle: listItem.auctionTitle,
            counterpartId: listItem.counterpartId,
            counterpartNickname: listItem.counterpartNickname,
            counterpartProfileImageUrl: listItem.counterpartProfileImageUrl,
          },
          productInfo: {
            currentPrice: auctionRes.data.currentPrice,
            sellingStatus: auctionRes.data.sellingStatus,
          },
        };
        setChatRoomData(fullRoomData);
      } catch (err: any) {
        console.error(err);
        let errorMessage = `채팅방 상세 정보를 불러올 수 없습니다.`;

        if (err.message === "CHAT_ROOM_NOT_FOUND") {
          errorMessage = "채팅방 목록에서 해당 방 정보를 찾을 수 없습니다.";
        } else if (err.message === "AUCTION_NOT_FOUND") {
          errorMessage = "상품이 삭제되어 더 이상 대화할 수 없습니다.";
        } else if (err.response?.status === 401) {
          // 💡 토큰 만료 등 다른 Axios 에러도 대비
          errorMessage = "인증 정보가 만료되었습니다. 다시 로그인해 주세요.";
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [token, chatroomId, isChatOpen]);

  return { chatRoomData, isLoading, error };
};
