import { useState, useEffect, useCallback } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import type { ChatRoomProps, ChatListItemProps } from "../types/ChatType";

export const useChatRoomApi = (chatroomId: number) => {
  const [chatRoom, setChatRoom] = useState<ChatRoomProps>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((state) => state.accessToken);
  const chatList = useChatModalStore((state) => state.chatList);

  // 데이터 로딩 로직
  const loadChatRoom = useCallback(async () => {
    if (!token || !chatroomId || !chatList) {
      setError("채팅방을 불러올 수 없습니다.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // const response = await api.get<ChatListItemProps[]>("/chatrooms/list", {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      // const listItem = response.data.find(
      //   (item) => item.chatroomId === chatroomId
      // );

      const listItem = chatList.find((item) => item.chatroomId === chatroomId);

      // listItem이 없을 경우
      if (!listItem) {
        setError("채팅 목록에서 해당 방을 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

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

      setChatRoom(fullRoomData);
    } catch (error) {
      console.error("Failed to load chat rooms:", error);
      setError(`채팅방을 불러올 수 없습니다: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [chatroomId, token]);
  useEffect(() => {
    loadChatRoom();
  }, [loadChatRoom]);

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
