import { useRef, useEffect, useState, useCallback } from "react";
import api from "../../../shared/api/axiosInstance";
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "../../auth/store/authStore";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import type { ModalProps } from "../../../shared/types/CommonType";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
import { X, ChevronLeft, EllipsisVertical } from "lucide-react";

const ChatModal = ({ onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore((state) => state.accessToken);
  const { toast, showToast, hideToast } = useToast();

  // 채팅목록/채팅방 화면 상태관리
  const {
    targetView,
    selectedChatroomId,
    chatList,
    loading,
    openChatList,
    openChatRoom,
    refetchChatList,
  } = useChatModalStore(
    useShallow((state) => ({
      targetView: state.targetView,
      selectedChatroomId: state.selectedChatroomId,
      chatList: state.chatList,
      loading: state.loading,
      openChatList: state.openChatList,
      openChatRoom: state.openChatRoom,
      refetchChatList: state.refetchChatList,
    }))
  );

  const [currentView, setCurrentView] = useState<string>(targetView);
  const selectedRoomListItem = chatList.find(
    (chat) => chat.chatroomId === selectedChatroomId
  );
  const counterpartNickname =
    selectedRoomListItem?.counterpartNickname || "사용자";

  // chatroom에서 해당 채팅방 삭제 메뉴 열기
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  // list에서 각 Chat 누를 시 채팅방으로 넘어가는 함수
  const handleSelectRoom = (chatroomId: number) => {
    const roomInfo = chatList.find((chat) => chat.chatroomId === chatroomId);
    if (roomInfo) {
      openChatRoom(chatroomId);
      setCurrentView("room");
    }
  };

  // 채팅방에서 목록으로 돌아갈 함수
  const handleGoToList = useCallback(async () => {
    openChatList();
    refetchChatList(token);
    setCurrentView("list");
  }, [openChatList, refetchChatList, token]);

  // 채팅방 삭제 함수
  const handleDeleteRoom = async (chatroomId: number) => {
    try {
      await api.delete(`/chatrooms/${chatroomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsMenuOpen(false);
      useChatModalStore
        .getState()
        .setChatList(
          useChatModalStore
            .getState()
            .chatList.filter((chat) => chat.chatroomId !== chatroomId)
        );
      refetchChatList(token);
      handleGoToList();
    } catch {
      showToast("채팅방 삭제에 실패했습니다.", "error");
    }
  };

  return (
    <>
      <div
        className="border-g500 fixed inset-0 z-49 h-full w-full border-1 bg-white text-wrap shadow-lg md:absolute md:inset-auto md:top-[72px] md:right-8 md:h-150 md:w-100 md:rounded-md"
        ref={modalRef}
      >
        <div className="border-purple flex flex-shrink-0 items-center justify-between border-b p-2">
          {/* 5. 현재 뷰에 따라 제목 및 돌아가기 버튼 표시 */}
          {currentView === "list" ? (
            <>
              <p className="font-bold">채팅목록</p>
              <button
                onClick={onClose}
                aria-label="채팅 모달 닫기"
                className="p-2"
              >
                <X />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleGoToList}
                className="p-2"
                aria-label="채팅목록으로 가기"
              >
                <ChevronLeft />
              </button>
              <p>{counterpartNickname}</p>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="더보기"
                className="p-2"
              >
                <EllipsisVertical className="text-g200 relative" />
              </button>
              {isMenuOpen && (
                <div className="border-g400 absolute top-10 right-3 mt-2 w-32 rounded-md border bg-white shadow-lg">
                  <button
                    onClick={() => {
                      setConfirmOpen(true);
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
            <ChatList chatList={chatList} onSelectRoom={handleSelectRoom} />
          )}
          {loading && (
            <p className="flex-column flex h-[100%] items-center justify-center p-4 text-center">
              채팅 목록 로딩 중...
            </p>
          )}
          {currentView === "room" && loading && <p>채팅방 정보 로딩 중...</p>}
          {currentView === "room" && !loading && selectedChatroomId && (
            <ChatRoom
              chatroomId={selectedChatroomId}
              setConfirmOpen={setConfirmOpen}
            />
          )}
          {confirmOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20">
              <div className="animate-fade-in w-72 rounded-md bg-white p-6 text-center shadow-sm">
                <p className="text-g100 mb-5 text-base font-medium">
                  채팅방을 삭제하시겠습니까?
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setConfirmOpen(false);
                      setIsMenuOpen(false);
                    }}
                    className="border-purple text-purple hover:bg-light-purple cursor-pointer rounded-md border px-4 py-2 font-semibold transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      setConfirmOpen(false);
                      handleDeleteRoom(selectedChatroomId!);
                    }}
                    className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md px-4 py-2 font-semibold text-white transition-colors"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default ChatModal;
