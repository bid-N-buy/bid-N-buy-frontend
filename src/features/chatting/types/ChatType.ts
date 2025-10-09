export interface ModalProps {
  onClose: () => void;
}

export interface ChatListProps {
  onSelectRoom: (chatroom_id: bigint) => void;
  chatRooms: ChatRoomProps[];
}

export interface ChatRoomProps {
  user_id?: bigint;
  nickname: string;
  image_url: string;
  chatroom_id: bigint;
  message?: string;
  created_at: string;
}

export interface ChatMessageProps {
  chatmessage_id: bigint;
  chatroom_id: bigint;
  sender_id: bigint;
  payment_id: bigint;
  image_url: string;
  message: string;
  message_type: string;
  created_at: string;
  is_read: boolean;
}
