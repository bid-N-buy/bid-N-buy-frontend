import { create } from "zustand";

type ModalView = "list" | "room";
type ChatModalState = {
  isChatOpen: boolean;
  targetView: ModalView;
  selectedChatroomId: string | null;
  openChatList: () => void;
  openChatRoom: (chatroomId: string) => void;
  onClose: () => void;
};

export const useChatModalStore = create<ChatModalState>((set) => ({
  isChatOpen: false,
  targetView: "list",
  selectedChatroomId: null,

  openChatList: () =>
    set({
      isChatOpen: true,
      targetView: "list",
      selectedChatroomId: null,
    }),
  openChatRoom: (chatroomId) =>
    set({
      isChatOpen: true,
      targetView: "room",
      selectedChatroomId: chatroomId,
    }),
  onClose: () =>
    set({
      isChatOpen: false,
      targetView: "list",
      selectedChatroomId: null,
    }),
}));
