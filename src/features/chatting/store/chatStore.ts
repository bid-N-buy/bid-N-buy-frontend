// new 알림 뱃지(빨간점) 용도 zustand store 사용

import { create } from "zustand";
import type { ChatListItemProps } from "../types/ChatType";

interface ChatState {
  chats: ChatListItemProps[];
}

export const useChatStore = create<ChatState>(() => ({
  chats: [],
}));
