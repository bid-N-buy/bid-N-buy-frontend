import { useRef, useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "../../auth/store/authStore";
// import { useChatListApi } from "../api/useChatList";
import { useChatRoomApi } from "../api/useChatRoom";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import type { ModalProps } from "../../../shared/types/CommonType";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import ChatList from "./ChatList";
import ChatRoom from "./ChatRoom";
import AddressModal from "./AddressModal";
import type { Address } from "../../mypage/types/address";
import type { ChatAddressModalProps } from "../types/ChatType";
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
    refetchChatList,
  } = useChatModalStore(
    useShallow((state) => ({
      targetView: state.targetView,
      selectedChatroomId: state.selectedChatroomId,
      chatList: state.chatList,
      loading: state.loading,
      openChatList: state.openChatList,
      refetchChatList: state.refetchChatList,
    }))
  );

  const [currentView, setCurrentView] = useState<string>(targetView);

  // chatlist 데이터
  type ChatListItem = (typeof chatList)[number]; // 불러와진 ChatListItemProps 중 원하는 요소만 사용
  // 이동할 roomInfo(list에서 접근 시)
  const [selectedRoomInfo, setSelectedRoomInfo] = useState<ChatListItem | null>(
    null
  );

  // chatroomId 분기점: header에서 버튼 눌렀을 때 || 경매 상세 페이지에서 챗방 생성했을 때
  const targetChatroomId = selectedRoomInfo?.chatroomId || selectedChatroomId;

  // chatroom 데이터
  const shouldEnableRoomApi = currentView === "room" && chatList.length > 0;
  const roomApi = useChatRoomApi(targetChatroomId!, shouldEnableRoomApi);

  // chatroom에서 해당 채팅방 삭제 메뉴
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isAdOpen, setIsAdOpen] = useState(false); // 주소
  const [editing, setEditing] = useState<Address | null>(null);
  const [addrMock, setAddrMock] = useState<boolean>(false);
  const [addressesMock, setAddressesMock] = useState<Address[]>([
    {
      addressId: 1,
      zonecode: "04524",
      address: "서울 중구 세종대로 110",
      detailAddress: "1층",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const onToggleModal = () => {
    setIsAdOpen((prev) => !prev);
  };

  const handleComplete = (data: Address) => {
    console.log(data);
    onToggleModal(); // 주소창은 자동으로 사라지므로 모달만 꺼주면 된다.
  };

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
      setSelectedRoomInfo(roomInfo);
      setCurrentView("room");
    }
  };

  // 채팅방에서 목록으로 돌아갈 함수
  const handleGoToList = async () => {
    setSelectedRoomInfo(null);
    openChatList();
    refetchChatList(token);
    setCurrentView("list");
  };

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
                {selectedRoomInfo?.counterpartNickname ||
                  roomApi!.chatRoom?.chatroomInfo.counterpartNickname ||
                  "사용자"}
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
                      handleDeleteRoom(targetChatroomId!);
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
        {isAdOpen && (
          <AddressModal
            open={isAdOpen}
            initial={editing}
            onClose={() => {
              setIsAdOpen(false);
              setEditing(null);
            }}
            onSave={async (draft) => {
              const payload: AddressDraft = {
                zonecode: draft.zonecode.trim(),
                address: draft.address.trim(),
                detailAddress: (draft.detailAddress ?? "").trim(),
              };

              if ((draft as any).addressId) {
                const id = (draft as any).addressId as number;
                await (addrMock
                  ? updateMock(id, payload)
                  : update(id, payload));
              } else {
                await (addrMock ? addMock(payload) : add(payload));
              }
            }}
          />
        )}
        <div className="h-[calc(100%-59px)] overflow-x-hidden overflow-y-auto">
          {currentView === "list" && (
            <ChatList chatList={chatList} onSelectRoom={handleSelectRoom} />
          )}
          {loading && (
            <p className="flex-column flex h-[100%] items-center justify-center p-4 text-center">
              채팅 목록 로딩 중...
            </p>
          )}
          {/* {listApi.error && (
            <p className="flex-column flex h-[100%] items-center justify-center p-4 text-red-500">
              {listApi.error}
            </p>
          )} */}
          {currentView === "room" && roomApi.isLoading && (
            <p>채팅방 정보 로딩 중...</p>
          )}
          {currentView === "room" && !roomApi.isLoading && roomApi.chatRoom && (
            <ChatRoom
              chatroomId={targetChatroomId!}
              sellerId={roomApi.chatRoom.sellerId}
              chatroomInfo={selectedRoomInfo || roomApi.chatRoom.chatroomInfo}
              productInfo={roomApi.chatRoom.productInfo}
            />
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
