import { useRef, useEffect, useState } from "react";
import type { ModalProps, ChatRoomProps } from "../types/ChatType";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
// import { useAuthStore } from "../../auth/store/authStore";
import { X, ChevronLeft, EllipsisVertical } from "lucide-react";
import { useChatApi } from "../api/useChatApi";

const ChatModal = ({ onClose, onDelete }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  // 채팅목록/채팅방 화면 상태관리
  const { targetView } = useChatModalStore();
  const [currentView, setCurrentView] = useState<string>(targetView);
  // 채팅목록 불러오기
  const { chatRooms, isLoading, error } = useChatApi();
  // 이동할 roomInfo
  const [selectedRoomInfo, setSelectedRoomInfo] =
    useState<ChatRoomProps | null>(null);
  // chatroom에서 해당 채팅방 삭제 메뉴
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const actualChatRoomId = 1;

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
  const handleSelectRoom = (chatroomId: string) => {
    const roomInfo = chatRooms.find((chat) => chat.chatroomId === chatroomId);
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
    <div
      className="border-g500 fixed inset-0 z-51 h-full w-full rounded-md border-1 bg-white text-wrap shadow-lg md:absolute md:inset-auto md:top-[72px] md:right-8 md:h-150 md:w-100"
      ref={modalRef}
    >
      <div className="border-purple flex flex-shrink-0 items-center justify-between border-b p-4">
        {/* 5. 현재 뷰에 따라 제목 및 돌아가기 버튼 표시 */}
        {currentView === "list" ? (
          <>
            <p className="font-bold">채팅목록</p>
            <button onClick={onClose} aria-label="채팅 모달 닫기">
              <X />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleGoToList}
              className="font-bold text-purple-600"
              aria-label="채팅목록으로 가기"
            >
              <ChevronLeft />
            </button>
            <p>
              {selectedRoomInfo?.nickname
                ? selectedRoomInfo.nickname
                : "사용자"}
            </p>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="더보기"
            >
              <EllipsisVertical className="text-g200 relative" />
            </button>
            {isMenuOpen && (
              <div className="border-g400 absolute top-10 right-3 mt-2 w-32 rounded-md border bg-white shadow-lg">
                <button
                  onClick={() => {
                    onDelete?.();
                    setIsMenuOpen(false);
                  }}
                  className="text-red hover:bg-g500 w-full px-4 py-2.5 text-left text-base transition-colors md:py-3"
                >
                  채팅방 삭제
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="h-[calc(100%-59px)] overflow-x-hidden overflow-y-auto">
        {currentView === "list" && (
          <ChatList chatRooms={chatRooms} onSelectRoom={handleSelectRoom} />
        )}
        {isLoading && (
          <p className="flex-column flex h-[100%] items-center justify-center p-4 text-center">
            채팅 목록 로딩 중...
          </p>
        )}
        {error && (
          <p className="flex-column flex h-[100%] items-center justify-center p-4 text-red-500">
            {error}
          </p>
        )}
        {currentView === "room" && selectedRoomInfo && (
          <ChatRoom
            chatroomId={selectedRoomInfo.chatroomId}
            buyerId={selectedRoomInfo.buyerId}
            sellerId={selectedRoomInfo.sellerId}
            auctionId={selectedRoomInfo.auctionId}
            nickname={selectedRoomInfo.nickname}
            imageUrl={selectedRoomInfo.imageUrl}
            message={selectedRoomInfo.message}
            createdAt={selectedRoomInfo.createdAt}
          />
        )}
      </div>
    </div>
  );
};

export default ChatModal;
