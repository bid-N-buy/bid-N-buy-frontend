import React from "react";
import { useRef, useEffect, useState } from "react";
import type { ModalProps, ChatRoomProps } from "../types/ChatType";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
import { X, ChevronLeft } from "lucide-react";

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
];

const ChatModal = ({ onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  // 채팅목록/채팅방 화면 상태관리
  const [currentView, setCurrentView] = useState<string>("list");
  // list에 더미 데이터 표시: useChatApi로 이동할 것
  const [chatRooms, setChatRooms] = useState<ChatRoomProps[]>(DUMMY_CHAT_ROOMS);
  // 이동할 roomInfo
  const [selectedRoomInfo, setSelectedRoomInfo] =
    useState<ChatRoomProps | null>(null);

  // modal창 닫기: 여백 누를 시 꺼지도록
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [modalRef, onClose]);

  // 각 Chat 누를 시 채팅방으로 넘어가는 함수
  const handleSelectRoom = (chatroom_id: bigint) => {
    const roomInfo = chatRooms.find((chat) => chat.chatroom_id === chatroom_id);
    if (roomInfo) {
      // 3. 찾은 정보를 상태로 저장 (이전 단계에서 논의된 ChatRoomProps 상태 사용)
      setSelectedRoomInfo(roomInfo);
      setCurrentView("room");
    }
  };

  // 채팅방에서 목록으로 돌아갈 함수
  const handleGoToList = () => {
    setSelectedRoomInfo(null);
    setCurrentView("list");
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 z-51 h-full w-full rounded-md bg-white shadow-md md:top-[50%] md:left-[50%] md:h-150 md:w-100 md:translate-[-50%]"
        ref={modalRef}
      >
        <div className="border-purple flex flex-shrink-0 items-center justify-between border-b p-4">
          {/* 5. 현재 뷰에 따라 제목 및 돌아가기 버튼 표시 */}
          {currentView === "list" ? (
            <>
              <p className="font-bold">채팅목록</p>
              <button onClick={onClose} aria-label="모달 닫기">
                <X />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleGoToList}
                className="font-bold text-purple-600"
              >
                <ChevronLeft />
              </button>
              <p>
                {selectedRoomInfo?.nickname
                  ? selectedRoomInfo.nickname
                  : "사용자"}
              </p>
              <button onClick={onClose} aria-label="모달 닫기">
                <X />
              </button>
            </>
          )}
        </div>
        <div className="h-[calc(100%-59px)] overflow-y-auto">
          {currentView === "list" && (
            <ChatList chatRooms={chatRooms} onSelectRoom={handleSelectRoom} />
          )}
          {currentView === "room" && selectedRoomInfo && (
            <ChatRoom
              roomId={selectedRoomInfo.chatroom_id.toString()}
              image_url={selectedRoomInfo.image_url}
              nickname={selectedRoomInfo.nickname}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
