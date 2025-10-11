import type { UserProps, ImageProps } from "../../../shared/types/CommonType";

export interface ModalProps {
  onClose: () => void;
  onDelete?: () => void;
  onRate?: () => void;
}

export interface ChatListProps {
  onSelectRoom: (chatroom_id: string) => void;
  chatRooms: ChatRoomProps[];
}

export interface ChatRoomProps {
  chatroom_id: string;
  buyer_id: UserProps["user_id"];
  seller_id?: UserProps["user_id"];
  auction_id: string;
  nickname: UserProps["nickname"];
  image_url: ImageProps["image_url"];
  message?: ChatMessageProps["message"];
  created_at?: ChatMessageProps["created_at"];
}

export interface ChatMessageProps {
  chatmessage_id: string;
  chatroom_id: ChatRoomProps["chatroom_id"];
  sender_id: UserProps["user_id"];
  payment_id: string;
  image_url: ChatRoomProps["image_url"];
  message: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}

export interface ChatInputProps {
  isConnected: boolean;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  sendMessage: () => void;
}
