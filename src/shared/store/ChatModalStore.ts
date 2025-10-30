import { create } from "zustand";
import type {
  ChatListItemProps,
  ChatMessageProps,
} from "../../features/chatting/types/ChatType";
import api from "../api/axiosInstance";
import { useAuthStore } from "../../features/auth/store/authStore";

const getUserId = () => useAuthStore.getState().userId;

type ChatModalState = {
  isChatOpen: boolean;
  targetView: string;
  selectedChatroomId: number | null;
  chatList: ChatListItemProps[];
  totalUnreadCount: number;
  loading: boolean;
  openChatList: () => void;
  openChatRoom: (chatroomId: number) => void;
  onClose: () => void;
  setChatList: (list: ChatListItemProps[]) => void;
  markAsRead: (chatroomId: number) => void;
  fetchChatList: (accessToken: string | null) => Promise<void>;
  refetchChatList: (accessToken: string | null) => Promise<void>;
  handleNewChatMessage: (message: ChatMessageProps) => void;
};

const calculateTotalUnread = (list: ChatListItemProps[]) =>
  list.reduce((total, item) => total + item.unreadCount, 0);

const updateChatState = (newChatList: ChatListItemProps[], set: Function) => {
  const newTotalUnreadCount = calculateTotalUnread(newChatList);
  console.log(newTotalUnreadCount);

  // 🚨 set 호출 방식 확인 필요
  set({
    chatList: newChatList,
    totalUnreadCount: newTotalUnreadCount, // 💡 이것이 가장 중요
  });
};

export const useChatModalStore = create<ChatModalState>((set, get) => ({
  isChatOpen: false,
  targetView: "list",
  selectedChatroomId: null,
  chatList: [],
  totalUnreadCount: 0,
  loading: false,

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
    set({ loading: true });
    try {
      const response = await api.get("/chatrooms/list", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      get().setChatList(response.data);
    } catch (error) {
      console.error("초기 unreadCount 로드 실패:", error);
      set({ loading: false });
    } finally {
      set({ loading: false });
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
