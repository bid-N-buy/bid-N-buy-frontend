import { useState, useEffect } from "react";
import axios from "axios";
import type { ChatRoomProps } from "../types/ChatType";

// 더미 데이터
const DUMMY_CHAT_ROOMS: ChatRoomProps[] = [
  {
    user_id: BigInt(1),
    nickname: "홍길동",
    image_url: "",
    chatroom_id: BigInt(101),
    message: "안녕하세요.",
    created_at: Date(),
  },
  {
    user_id: BigInt(2),
    nickname: "김철수",
    image_url: "",
    chatroom_id: BigInt(102),
    message: "네고 가능할까요?",
    created_at: Date(),
  },
  // ...
];

export const useChatApi = () => {
  // list에 더이 데이터 표시
  const [chatRooms, setChatRooms] = useState<ChatRoomProps[]>(DUMMY_CHAT_ROOMS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    // return <Skeleton />
  }

  if (error) {
    // return (
    //   <div className="flex justify-center items-center h-48 text-red-500">
    //     {error}
    //   </div>
    // );
  }

  // 임시 데이터 로딩 로직
  useEffect(() => {
    const loadChatList = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get<ChatRoomProps[]>("/chatrooms/list");

        setChatRooms(response.data);
      } catch (error) {
        console.error("Failed to load chat rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadChatList();
  }, []);

  return { chatRooms, isLoading, error };
};
