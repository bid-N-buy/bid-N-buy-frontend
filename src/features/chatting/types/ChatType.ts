import type { AuctionResponse } from "../../auction/types/product";
export interface ModalProps {
  onClose: () => void;
  onDelete?: () => void;
}

export interface ChatListItemProps {
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

export interface ChatListProps {
  chatList: ChatListItemProps[];
  onSelectRoom: (chatroomId: string) => void;
}

export interface ChatRoomProps {
  chatroomId: string;
  chatroomInfo: Pick<
    ChatListItemProps,
    | "chatroomId"
    | "auctionId"
    | "auctionImageUrl"
    | "auctionTitle"
    | "counterpartId"
    | "counterpartNickname"
    | "counterpartProfileImageUrl"
  >;
  productInfo: Pick<AuctionResponse, "currentPrice" | "sellingStatus">;
}

export interface ChatProductInfoProps {
  auctionId: string;
  auctionImageUrl: string;
  auctionTitle: string;
  currentPrice: number;
  sellingStatus: string;
}

export interface ChatMessageProps {
  chatmessageId: string;
  chatroomId: ChatListItemProps["chatroomId"];
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
  Pick<ChatListItemProps, "counterpartNickname" | "counterpartProfileImageUrl">;

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
