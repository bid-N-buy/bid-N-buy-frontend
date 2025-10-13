import type { UserProps, ImageProps } from "../../../shared/types/CommonType";

export interface ModalProps {
  onClose: () => void;
  onDelete?: () => void;
}

export interface ChatListProps {
  onSelectRoom: (chatroomId: string) => void;
  chatRooms: ChatRoomProps[];
}

export interface ChatRoomProps {
  chatroomId: string;
  buyerId: UserProps["userId"];
  sellerId: UserProps["userId"];
  auctionId: string;
  nickname: UserProps["nickname"];
  imageUrl: ImageProps["imageUrl"];
  message?: ChatMessageProps["message"];
  createdAt: Date;
}

export interface ChatMessageProps {
  chatmessageId: string;
  chatroomId: ChatRoomProps["chatroomId"];
  senderId: UserProps["userId"];
  paymentId?: string;
  imageUrl: ChatRoomProps["imageUrl"];
  message: string;
  messageType: string;
  createdAt: string;
  isRead: boolean;
}

export type ChatYouProps = Pick<
  ChatMessageProps,
  "createdAt" | "imageUrl" | "message" | "isRead" | "messageType" | "paymentId"
> &
  Pick<ChatRoomProps, "nickname">;

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
