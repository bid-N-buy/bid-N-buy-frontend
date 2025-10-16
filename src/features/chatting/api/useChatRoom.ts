import { useState, useEffect, useCallback } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatRoomProps, ChatListItemProps } from "../types/ChatType";

export const useChatRoomApi = (chatroomId: number, isEnable: boolean) => {
  const [chatRoom, setChatRoom] = useState<ChatRoomProps>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.accessToken);

  console.log("chatRoomApi 실행 중");

  // 데이터 로딩 로직
  const loadChatRoom = useCallback(async () => {
    if (!token || !chatroomId) {
      setError("채팅방을 불러올 수 없습니다.");
      setIsLoading(false);
      return;
    }

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

      // listItem이 없을 경우
      if (!listItem) {
        setError("채팅 목록에서 해당 방을 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      const auctionRes = await api.get(`/auctions/${listItem!.auctionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fullRoomData = {
        chatroomId: chatroomId,
        sellerId: auctionRes.data.sellerId,
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
  }, [chatroomId, token]);
  useEffect(() => {
    if (isEnable) loadChatRoom();
  }, [loadChatRoom, isEnable]);

  return { chatRoom, isLoading, error, refetch: loadChatRoom };
};

export const useChatRoomAuc = (sellerId: number, auctionId: number) => {
  const [chatRoom, setChatRoom] = useState<ChatRoomProps>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.accessToken);

  // 데이터 로딩 로직
  const loadChatRoom = async () => {
    if (!token || !sellerId || !auctionId) {
      setError("채팅방을 불러올 수 없습니다.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<ChatListItemProps[]>("/chatrooms/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const listItem = response.data.find(
        (item) =>
          item.counterpartId === sellerId && item.auctionId === auctionId
      );

      // listItem이 없을 경우
      if (!listItem) {
        setError("채팅 목록에서 해당 방을 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      const auctionRes = await api.get(`/auctions/${listItem!.auctionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fullRoomData = {
        chatroomId: listItem.chatroomId,
        sellerId: auctionRes.data.sellerId,
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

  return { chatRoom, isLoading, error, loadChatRoom };
};
