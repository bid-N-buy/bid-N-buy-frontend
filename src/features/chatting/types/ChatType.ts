import type { AuctionResponse } from "../../auction/types/product";

export const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;
export interface ModalProps {
  isChatOpen?: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export interface ChatListItemProps {
  chatroomId: number;
  auctionId: number;
  counterpartId: number;
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
  onSelectRoom: (chatroomId: number) => void;
}

export interface ChatRoomProps {
  chatroomId: number;
  sellerId: number;
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
  auctionId: number;
  auctionImageUrl: string;
  auctionTitle: string;
  currentPrice: number;
  counterpartId: number;
  sellerId: number;
  sellingStatus: string;
  handleSendPaymentRequest: () => void;
}

export interface ChatMessageProps {
  chatmessageId: number;
  chatroomId: ChatListItemProps["chatroomId"];
  senderId: number;
  paymentId?: string;
  imageUrl: string | null;
  message: string;
  messageType: string;
  createdAt: string;
  read: boolean;
}

export type ChatYouProps = Pick<
  ChatMessageProps,
  "createdAt" | "message" | "read" | "messageType" | "paymentId"
> &
  Pick<
    ChatListItemProps,
    "counterpartNickname" | "counterpartProfileImageUrl"
  > &
  Pick<ChatRoomProps, "sellerId"> &
  Pick<AuctionResponse, "currentPrice"> &
  Pick<ChatListItemProps, "auctionImageUrl" | "auctionTitle">;

export type ChatMeProps = Pick<
  ChatMessageProps,
  "createdAt" | "message" | "read" | "messageType" | "paymentId"
> &
  Pick<ChatRoomProps, "sellerId"> &
  Pick<AuctionResponse, "currentPrice"> &
  Pick<ChatListItemProps, "auctionImageUrl" | "auctionTitle">;

export interface ChatInputProps {
  isConnected: boolean;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
}
