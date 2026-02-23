import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../auth/store/authStore";
import ChatProductInfo from "../components/ChatProductInfo";
import ChatMe from "../components/ChatMe";
import ChatYou from "../components/ChatYou";
import ChatInput from "../components/ChatInput";
import ChatDate from "../components/ChatDate";
import { useChatSocket } from "../hooks/useChatSocket";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import { useChatRoomData } from "../hooks/useChatRoomData";

const ChatRoom = ({
  chatroomId,
  setConfirmOpen,
}: {
  chatroomId: number;
  setConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // 토큰/유저아이디 전역에서 들고 오기
  const token = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore.getState().userId;
  const [inputMessage, setInputMessage] = useState("");

  // 스크롤 하단 위치 위한 useRef
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { chatRoomData, isLoading, error } = useChatRoomData(chatroomId);

  const { markAsRead } = useChatModalStore();

  const {
    clientRef,
    fetchMessageHistory,
    webSocketLogic,
    messages,
    isConnected,
    sendReadStatus,
    handleSendPaymentRequest,
    handleSendAddress,
    handleSendImage,
  } = useChatSocket(chatroomId);

  // [전송] 채팅(기본) 메시지
  const handleSendMessage = useCallback(() => {
    const client = clientRef.current;

    if (!client || !client.connected || !inputMessage.trim()) {
      console.warn("연결되지 않았거나 메시지가 비어있습니다.");
      return;
    }
    // 메시지 생성
    const chatMessage = {
      chatroomId: chatroomId,
      senderId: userId,
      message: inputMessage.trim(),
      messageType: "CHAT",
    };

    // 전송 실행
    client.publish({
      destination: `/app/chat/message`,
      body: JSON.stringify(chatMessage),
      headers: { "content-type": "application/json" },
    });

    // 입력 상태 초기화
    setInputMessage("");
  }, [chatroomId, clientRef, inputMessage, userId]);

  useEffect(() => {
    if (!token || !chatroomId) return;

    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    fetchMessageHistory(chatroomId, token);
    webSocketLogic();

    // Cleanup
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [chatroomId, clientRef, fetchMessageHistory, token, webSocketLogic]);

  useEffect(() => {
    if (chatroomId) markAsRead(chatroomId);
  }, [chatroomId, markAsRead]);

  useEffect(() => {
    if (!chatroomId || !userId || !isConnected) {
      return;
    }
    if (messages.length === 0) {
      return;
    }
    sendReadStatus();
  }, [chatroomId, userId, isConnected, messages.length, sendReadStatus]);

  // 새 메시지 생길 시 자동 스크롤 이동
  useEffect(() => {
    if (!chatContainerRef.current || isLoading) return;
    chatContainerRef.current!.scrollTop =
      chatContainerRef.current!.scrollHeight;
  }, [chatContainerRef, isLoading, messages]);

  if (isLoading)
    return (
      <div className="text-g300 flex h-[100%] items-center justify-center text-sm">
        로딩 중...
      </div>
    );
  if (!chatRoomData || error)
    return (
      <div className="flex h-[100%] flex-col items-center justify-center gap-2">
        <p className="text-g300 text-sm">
          {error || "채팅방 정보를 불러올 수 없습니다."}
        </p>
        <button
          type="button"
          className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md px-3 py-1 text-sm font-bold text-white transition-colors"
          onClick={() => setConfirmOpen(true)}
        >
          채팅방 삭제
        </button>
      </div>
    );

  return (
    <>
      <ChatProductInfo
        auctionInfo={chatRoomData.chatroomInfo}
        sellerId={chatRoomData.sellerId}
        currentPrice={chatRoomData.productInfo.currentPrice}
        sellingStatus={chatRoomData.productInfo.sellingStatus}
        handleSendPaymentRequest={handleSendPaymentRequest}
        handleSendAddress={handleSendAddress}
        isLocked={chatRoomData.isLocked}
      />
      <div
        ref={chatContainerRef}
        key={chatroomId}
        className="h-[calc(100%-12.5rem)] w-[100%] overflow-x-hidden overflow-y-scroll"
      >
        {messages.length === 0 && (
          <div className="text-g300 flex h-[100%] items-center justify-center text-sm">
            메시지를 보내 보세요.
          </div>
        )}
        {messages.map((msg, index) => {
          const messageDate = new Date(msg.createdAt).toDateString(); // 현재 메시지 날짜
          const prevMsg = messages[index - 1];
          const prevMessageDate = prevMsg
            ? new Date(prevMsg.createdAt).toDateString()
            : null; // 이전 메시지 날짜

          // 날짜 경계선을 표시
          const showDateSeparator =
            index === 0 || messageDate !== prevMessageDate;
          return (
            <>
              {showDateSeparator && <ChatDate date={msg.createdAt} />}
              {msg.senderId === userId ? (
                <ChatMe
                  key={index}
                  sellerId={chatRoomData.sellerId!}
                  msgInfo={msg}
                  auctionInfo={chatRoomData.chatroomInfo}
                  currentPrice={chatRoomData.productInfo.currentPrice!}
                />
              ) : (
                <ChatYou
                  key={index}
                  sellerId={chatRoomData.sellerId!}
                  msgInfo={msg}
                  counterpartInfo={chatRoomData.chatroomInfo}
                  auctionInfo={chatRoomData.chatroomInfo}
                  currentPrice={chatRoomData.productInfo.currentPrice!}
                />
              )}
            </>
          );
        })}
        {chatRoomData?.lockMessage && (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-4">
            <p className="text-g300 text-sm">{chatRoomData?.lockMessage}</p>
            <button
              type="button"
              className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md px-3 py-1 text-sm font-bold text-white transition-colors"
              onClick={() => setConfirmOpen(true)}
            >
              채팅방 삭제
            </button>
          </div>
        )}
      </div>

      <ChatInput
        isConnected={isConnected && !chatRoomData?.lockMessage}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={handleSendMessage}
        handleSendImage={handleSendImage}
      />
    </>
  );
};

export default ChatRoom;
