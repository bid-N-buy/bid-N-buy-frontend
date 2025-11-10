import { useEffect, useRef } from "react";
import { useAuthStore } from "../../auth/store/authStore";
// import { useChatListApi } from "../api/useChatList";
import ChatProductInfo from "../components/ChatProductInfo";
import ChatMe from "../components/ChatMe";
import ChatYou from "../components/ChatYou";
import ChatInput from "../components/ChatInput";
// import ChatDate from "../components/ChatDate"; 날짜 넘어갈 시에 사용
// import type { ChatRoomProps } from "../types/ChatType";
import { useChatSocket } from "../hooks/useChatSocket";
import { useChatRoomData } from "../hooks/useChatRoomData";

const ChatRoom = ({ chatroomId }: { chatroomId: number }) => {
  // 토큰/유저아이디 전역에서 들고 오기
  const token = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore.getState().userId;

  // 스크롤 하단 위치 위한 useRef
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { chatRoomData, isLoading, error } = useChatRoomData(chatroomId);

  const {
    clientRef,
    fetchMessageHistory,
    webSocketLogic,
    messages,
    inputMessage,
    setInputMessage,
    isConnected,
    sendReadStatus,
    sendMessage,
    handleSendPaymentRequest,
    handleSendAddress,
    handleSendImage,
  } = useChatSocket(chatroomId);

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
    return <div className="h-full w-full text-center">로딩 중</div>;
  if (!chatRoomData || error)
    return <div className="h-full w-full text-center">에러가 있습니다.</div>;

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
        sendMessage={sendMessage}
        handleSendImage={handleSendImage}
      />
    </>
  );
};

export default ChatRoom;
