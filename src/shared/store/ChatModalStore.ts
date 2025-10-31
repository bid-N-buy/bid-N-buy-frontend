import { create } from "zustand";
import type {
  ChatListItemProps,
  ChatMessageProps,
  ChatRoomProps,
} from "../../features/chatting/types/ChatType";
import api from "../api/axiosInstance";
import { useAuthStore } from "../../features/auth/store/authStore";

const getUserId = () => useAuthStore.getState().userId;

type ChatModalState = {
  isChatOpen: boolean;
  targetView: string;
  selectedChatroomId: number | null;
  chatList: ChatListItemProps[];
  chatRoom: ChatRoomProps | null;
  totalUnreadCount: number;
  loading: boolean;
  error: string | null;
};
type ChatModalAction = {
  openChatList: () => void;
  openChatRoom: (chatroomId: number) => void;
  onClose: () => void;
  setChatList: (list: ChatListItemProps[]) => void;
  markAsRead: (chatroomId: number) => void;
  fetchChatList: (accessToken: string | null) => Promise<void>;
  refetchChatList: (accessToken: string | null) => Promise<void>;
  fetchChatRoom: (
    accessToken: string | null,
    chatroomId: number
  ) => Promise<void>;
  makeChatRoomInAuc: (
    accessToken: string | null,
    sellerId: number,
    auctionId: number
  ) => Promise<void>;
  handleNewChatMessage: (message: ChatMessageProps) => void;
};

type ChatModalStoreProps = ChatModalAction & ChatModalState;

const calculateTotalUnread = (list: ChatListItemProps[]) =>
  list.reduce((total, item) => total + item.unreadCount, 0);

const updateChatState = (newChatList: ChatListItemProps[], set) => {
  const newTotalUnreadCount = calculateTotalUnread(newChatList);
  set({
    chatList: newChatList,
    totalUnreadCount: newTotalUnreadCount,
  });
};

export const useChatModalStore = create<ChatModalStoreProps>((set, get) => ({
  isChatOpen: false,
  targetView: "list",
  selectedChatroomId: null,
  chatList: [],
  chatRoom: null,
  totalUnreadCount: 0,
  loading: false,
  error: null,

  // 채팅 모달 여는 상태
  openChatList: () =>
    set({
      isChatOpen: true,
      targetView: "list",
      selectedChatroomId: null,
    }),
  //챗방 들어갔을 때
  openChatRoom: (chatroomId) => {
    set({
      isChatOpen: true,
      targetView: "room",
      selectedChatroomId: chatroomId,
    });
  },
  //채팅 모달 닫을 때
  onClose: () =>
    set({
      isChatOpen: false,
      targetView: "list",
      selectedChatroomId: null,
    }),
  // 채팅 리스트 상태 갱신
  setChatList: (list) => {
    updateChatState(list, set);
  },
  // 채팅방 입장 시 전부 읽음
  markAsRead: (chatroomId) => {
    const { chatList } = get();

    const updatedList = chatList.map((item) => {
      if (item.chatroomId === chatroomId) {
        return { ...item, unreadCount: 0 };
      }
      return item;
    });

    updateChatState(updatedList, set);
  },
  // 로그인 시, 직전까지의 채팅 리스트 상태 갱신
  fetchChatList: async (accessToken) => {
    set({ error: null, loading: true });
    try {
      const response = await api.get("/chatrooms/list", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      get().setChatList(response.data);
    } catch (error) {
      console.error("초기 unreadCount 로드 실패:", error);
      set({ error: "초기 unreadCount 로드 실패", loading: false });
    } finally {
      set({ error: "초기 unreadCount 로드 실패", loading: false });
    }
  },
  // 모달 열려 있는 중 재갱신
  refetchChatList: async (accessToken) => {
    try {
      const response = await api.get("/chatrooms/list", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      get().setChatList(response.data);
    } catch (error) {
      console.error("채팅 목록 리로드 실패:", error);
    }
  },
  fetchChatRoom: async (accessToken, chatroomId) => {
    const { chatList } = get();

    try {
      set({
        loading: true,
        error: null,
      });
      const listItem = chatList.find((item) => item.chatroomId === chatroomId);

      if (!listItem) {
        set({
          error: "채팅 목록에서 해당 방을 찾을 수 없습니다.",
          loading: false,
        });
        return;
      }
      const auctionRes = await api.get(`/auctions/${listItem.auctionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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
      set({ chatRoom: fullRoomData });
    } catch (error) {
      console.error("Failed to load chat room detail:", error);
      set({
        error: `채팅방을 불러올 수 없습니다: ${error}`,
        chatRoom: null,
      });
    } finally {
      set({ loading: false });
    }
  },
  makeChatRoomInAuc: async (accessToken, sellerId, auctionId) => {
    try {
      set({
        loading: true,
        error: null,
      });
      const response = await api.get<ChatListItemProps[]>("/chatrooms/list", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const listItem = response.data.find(
        (item) =>
          item.counterpartId === sellerId && item.auctionId === auctionId
      );

      if (!listItem) {
        set({
          error: "채팅 목록에서 해당 방을 찾을 수 없습니다.",
          loading: false,
        });
        return;
      }

      const auctionRes = await api.get(`/auctions/${listItem!.auctionId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
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

      set({ chatRoom: fullRoomData });
    } catch (error) {
      console.error("Failed to load chat rooms:", error);
      set({
        error: `채팅방을 불러올 수 없습니다: ${error}`,
        chatRoom: null,
      });
    } finally {
      set({ loading: false });
    }
  },
  // 실시간 전체메시지 읽음 상태 갱신(리스트)
  handleNewChatMessage: (message) => {
    const { chatList, selectedChatroomId } = get();
    const myUserId = getUserId();

    // 현재 채팅방에 입장해 있는 상태라면 메시지 업데이트되는 방과 동일한지?
    const isInThisRoom = selectedChatroomId === message.chatroomId;
    // 내가 보내는 사람인지?
    const isSenderMe = message.senderId === myUserId;

    let updatedRoom: ChatListItemProps | null = null;
    const updatedList = chatList.filter((item) => {
      if (item.chatroomId === message.chatroomId) {
        updatedRoom = {
          ...item,
          // 접속한 방이 맞는지와 보낸 사람이 나인지를 확인한 후 맞으면 unReadCount X
          unreadCount: isInThisRoom || isSenderMe ? 0 : item.unreadCount + 1,
          lastMessagePreview: message.message,
          lastMessageTime: message.createdAt,
        };
        console.log(updatedRoom, item.unreadCount);
        return false;
      }
      return true;
    });
    if (updatedRoom) {
      // 업데이트된 챗룸 가장 위로 정렬된 새 리스트 정의
      const newChatList = [updatedRoom, ...updatedList];
      updateChatState(newChatList, set);
    }
  },
}));
