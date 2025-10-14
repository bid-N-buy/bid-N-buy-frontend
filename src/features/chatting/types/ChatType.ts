export interface ModalProps {
  onClose: () => void;
  onDelete?: () => void;
}

export interface ChatListProps {
  onSelectRoom: (chatroomId: string) => void;
  chatroomId: string;
  auctionId: string;
  counterpartId: string;
  counterpartNickname: string;
  counterpartProfileImageUrl: string | null;
  auctionTitle: string;
  auctionImageUrl: string | null;
  lastMessageTime: string;
  lastMessagePreview: string;
  unreadCount: number;
}

export interface ChatRoomProps {
  chatroomId: ChatListProps["chatroomId"];
  auctionId: ChatListProps["auctionId"];
  auctionTitle: ChatListProps["auctionTitle"];
  counterpartId: ChatListProps["counterpartId"];
  auctionImageUrl: ChatListProps["auctionImageUrl"];
  counterpartNickname: ChatListProps["counterpartNickname"];
  counterpartProfileImageUrl: ChatListProps["counterpartProfileImageUrl"];
  message?: ChatMessageProps["message"];
}

export interface ChatMessageProps {
  chatmessageId: string;
  chatroomId: ChatRoomProps["chatroomId"];
  senderId: number;
  paymentId?: string;
  imageUrl: string | null;
  message: string;
  messageType: string;
  createdAt: string;
  isRead: boolean;
}

export type ChatYouProps = Pick<
  ChatMessageProps,
  "createdAt" | "message" | "isRead" | "messageType" | "paymentId"
> &
  Pick<ChatRoomProps, "counterpartNickname" | "counterpartProfileImageUrl">;

export type ChatMeProps = Pick<
  ChatMessageProps,
  "createdAt" | "message" | "isRead" | "messageType" | "paymentId"
>;

export interface ChatInputProps {
  isConnected: boolean;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
}
