import { create } from "zustand";
import type { ChatMessageProps } from "../../features/chatting/types/ChatType";

type ModalView = "list" | "room";
type ChatModalState = {
  isChatOpen: boolean;
  targetView: ModalView;
  selectedChatroomId: number | null;
  chatList: ChatListItemState[];
  totalUnreadCount: number;
  initialLoading: boolean;
  openChatList: () => void;
  openChatRoom: (chatroomId: number) => void;
  onClose: () => void;
  setChatList: (list: ChatListItemState[]) => void;
  markAsRead: (chatroomId: number) => void;
  fetchInitialChatList: (accessToken: string) => Promise<void>;
  handleNewChatMessage: (message: ChatMessageProps) => void;
};

interface ChatListItemState {
  chatroomId: number;
  unreadCount: number;
}

const calculateTotalUnread = (list: ChatListItemState[]) =>
  list.reduce((total, item) => total + item.unreadCount, 0);

export const useChatModalStore = create<ChatModalState>((set, get) => ({
  isChatOpen: false,
  targetView: "list",
  selectedChatroomId: null,
  chatList: [],
  totalUnreadCount: 0,
  initialLoading: false,

  openChatList: () =>
    set({
      isChatOpen: true,
      targetView: "list",
      selectedChatroomId: null,
    }),
  openChatRoom: (chatroomId) => {
    get().markAsRead(chatroomId);
    set({
      isChatOpen: true,
      targetView: "room",
      selectedChatroomId: chatroomId,
    });
  },
  onClose: () =>
    set({
      isChatOpen: false,
      targetView: "list",
      selectedChatroomId: null,
    }),
  setChatList: (list) => {
    set({
      chatList: list,
      totalUnreadCount: calculateTotalUnread(list),
    });
  },
  markAsRead: (chatroomId) => {
    const { chatList } = get();

    const updatedList = chatList.map((item) => {
      if (item.chatroomId === chatroomId) {
        return { ...item, unreadCount: 0 };
      }
      return item;
    });

    set({
      chatList: updatedList,
      totalUnreadCount: calculateTotalUnread(updatedList),
    });
  },
  fetchInitialChatList: (accessToken) => {},
}));
