// import type { AuctionDetail } from "../../auction/types/auctions";

export const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

export interface ChatListItemProps {
  chatroomId: number | null;
  auctionId: number | null;
  auctionTitle: string | null;
  auctionImageUrl: string | null;
  counterpartId: number | null;
  counterpartNickname: string | null;
  counterpartProfileImageUrl: string | null;
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
  sellerId: number | null;
  chatroomInfo: Pick<
    ChatListItemProps,
    | "auctionId"
    | "auctionImageUrl"
    | "auctionTitle"
    | "counterpartId"
    | "counterpartNickname"
    | "counterpartProfileImageUrl"
  >;
  productInfo: { currentPrice: number | null; sellingStatus: string | null };
  isLocked?: boolean;
  lockReason?: "WITHDRAWN" | "AUCTION_DELETED" | null;
  lockMessage?: string;
}

export interface ChatProductInfoProps {
  auctionInfo: Pick<
    ChatListItemProps,
    "auctionId" | "auctionImageUrl" | "auctionTitle" | "counterpartId"
  >;
  currentPrice: number | null;
  sellerId: number | null;
  sellingStatus: string | null;
  handleSendPaymentRequest: (
    auctionId: number,
    buyerId: number,
    sellerId: number,
    currentPrice: number
  ) => void;
  handleSendAddress: (
    auctionId: number,
    buyerId: number,
    sellerId: number
  ) => void;
  isLocked?: boolean;
}

export interface ChatMessageProps {
  chatmessageId: number;
  chatroomId: number;
  senderId: number;
  imageUrl: string | null;
  message: string;
  messageType: string;
  createdAt: string;
  read: boolean;
}

export type ChatMeProps = {
  msgInfo: Pick<
    ChatMessageProps,
    "createdAt" | "message" | "read" | "messageType" | "imageUrl"
  >;
  sellerId: number;
  currentPrice: number;
  auctionInfo: Pick<ChatListItemProps, "auctionImageUrl" | "auctionTitle">;
};

export type ChatYouProps = {
  msgInfo: Pick<
    ChatMessageProps,
    "createdAt" | "message" | "read" | "messageType" | "imageUrl"
  >;
  counterpartInfo: Pick<
    ChatListItemProps,
    "counterpartNickname" | "counterpartProfileImageUrl"
  >;
  sellerId: number;
  currentPrice: number;
  auctionInfo: Pick<
    ChatListItemProps,
    "auctionId" | "auctionImageUrl" | "auctionTitle"
  >;
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
}
