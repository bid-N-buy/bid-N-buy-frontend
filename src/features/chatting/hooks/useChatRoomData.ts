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
        });

        const listItem = listResponse.data.find(
          (item: ChatListItemProps) => item.chatroomId === chatroomId
        );

        if (!listItem) throw new Error("채팅 목록에서 방을 찾을 수 없습니다.");

        const auctionRes = await api.get(`/auctions/${listItem.auctionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
      } catch (err) {
        console.error("채팅방 상세 로드 실패:", err);
        setError(`채팅방 상세 정보를 불러올 수 없습니다.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [token, chatroomId, isChatOpen]);

  return { chatRoomData, isLoading, error };
};
