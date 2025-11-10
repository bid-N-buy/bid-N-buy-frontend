import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../auth/store/authStore";
import ChatProductInfo from "../components/ChatProductInfo";
import ChatMe from "../components/ChatMe";
import ChatYou from "../components/ChatYou";
import ChatInput from "../components/ChatInput";
// import ChatDate from "../components/ChatDate"; 날짜 넘어갈 시에 사용
import { useChatSocket } from "../hooks/useChatSocket";
import { useChatRoomData } from "../hooks/useChatRoomData";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";

const ChatRoom = ({ chatroomId }: { chatroomId: number }) => {
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
      <div className="text-g300 flex h-[100%] items-center justify-center text-sm">
        {error}
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
        {messages.map((msg, index) =>
          msg.senderId === userId ? (
            <ChatMe
              key={index}
              sellerId={chatRoomData.sellerId}
              msgInfo={msg}
              auctionInfo={chatRoomData.chatroomInfo}
              currentPrice={chatRoomData.productInfo.currentPrice}
            />
          ) : (
            <ChatYou
              key={index}
              sellerId={chatRoomData.sellerId}
              msgInfo={msg}
              counterpartInfo={chatRoomData.chatroomInfo}
              auctionInfo={chatRoomData.chatroomInfo}
              currentPrice={chatRoomData.productInfo.currentPrice}
            />
          )
        )}
      </div>

      <ChatInput
        isConnected={isConnected}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={handleSendMessage}
        handleSendImage={handleSendImage}
      />
    </>
  );
};

export default ChatRoom;
