import type { AuctionDetail } from "../../auction/types/auctions";

export const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;
export interface ModalProps {
  isChatOpen?: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export interface ChatListItemProps {
  chatroomId: number;
  auctionId: number;
  auctionTitle: string;
  auctionImageUrl: string | null;
  counterpartId: number;
  counterpartNickname: string;
  counterpartProfileImageUrl: string | null;
  lastMessageTime: string;
  lastMessagePreview: string;
  unis_readCount: number;
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
  productInfo: Pick<AuctionDetail, "currentPrice" | "sellingStatus">;
}

export interface ChatProductInfoProps {
  auctionInfo: Pick<
    ChatListItemProps,
    "auctionId" | "auctionImageUrl" | "auctionTitle" | "counterpartId"
  >;
  currentPrice: number;
  sellerId: number;
  sellingStatus: string;
  handleSendPaymentRequest: (
    auctionId: number,
    buyerId: number,
    sellerId: number,
    currentPrice: number
  ) => void;
}

export interface ChatMessageProps {
  chatmessageId: number;
  chatroomId: ChatListItemProps["chatroomId"];
  senderId: number;
  imageUrl: string | null;
  message: string;
  messageType: string;
  createdAt: string;
  is_read: boolean;
}

export type ChatMeProps = {
  msgInfo: Pick<
    ChatMessageProps,
    "createdAt" | "message" | "is_read" | "messageType" | "imageUrl"
  >;
  sellerId: number;
  currentPrice: number;
  auctionInfo: Pick<ChatListItemProps, "auctionImageUrl" | "auctionTitle">;
  handleSendPaymentRequest: (
    auctionId: number,
    buyerId: number,
    sellerId: number,
    currentPrice: number
  ) => void;
};

export type ChatYouProps = {
  msgInfo: Pick<
    ChatMessageProps,
    "createdAt" | "message" | "is_read" | "messageType" | "imageUrl"
  >;
  counterpartInfo: Pick<
    ChatListItemProps,
    "counterpartNickname" | "counterpartProfileImageUrl"
  >;
  sellerId: number;
  currentPrice: number;
  auctionInfo: Pick<ChatListItemProps, "auctionImageUrl" | "auctionTitle">;
  handleSendPaymentRequest: (
    auctionId: number,
    buyerId: number,
    sellerId: number,
    currentPrice: number
  ) => void;
};

export interface ChatInputProps {
  isConnected: boolean;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
  handleSendImage: (image: File) => void;
}

export interface ChatAddressModalProps {
  postcode: string;
  address1: string;
  address2?: string;
  isDefault: boolean;
}
