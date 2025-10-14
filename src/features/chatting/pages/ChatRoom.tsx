import { useState, useEffect, useRef } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "../../auth/store/authStore";
import ChatProductInfo from "../components/ChatProductInfo";
import ChatMe from "../components/ChatMe";
import ChatYou from "../components/ChatYou";
import ChatInput from "../components/ChatInput";
// import ChatDate from "../components/ChatDate"; 날짜 넘어갈 시에 사용
import type { ChatRoomProps, ChatMessageProps } from "../types/ChatType";
import type { UserProps } from "../../../shared/types/CommonType";

const ChatRoom = ({
  chatroomId,
  buyerId,
  sellerId,
  auctionId,
  auctionImageUrl,
  auctionTitle,
  counterpartProfileImageUrl,
  counterpartNickname,
}: ChatRoomProps) => {
  // STOMP 클라이언트 인스턴스를 저장하기 위해 useRef 사용 (재렌더링 시에도 값이 유지됨)
  const clientRef = useRef<Client | null>(null);
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // 토큰 전역에서 들고 오기
  const token = useAuthStore((state) => state.accessToken);

  // 웹소켓 주소
  const wsUrl = "http://localhost:8080/ws/bid";

  useEffect(() => {
    // STOMP 클라이언트 인스턴스 생성
    const client = new Client({
      // 💡 SockJS 연결을 사용하도록 webSocketFactory 설정
      webSocketFactory: () => {
        return new SockJS(wsUrl);
      },

      reconnectDelay: 5000,

      // CONNECT 헤더에 JWT 토큰 추가
      connectHeaders: {
        "Auth-Token": `${token}`,
      },

      onConnect: () => {
        console.log("STOMP 연결 성공!");
        setIsConnected(true);

        // 연결 성공 시 채팅방 구독
        const subDestination = `/topic/chat/room/${chatroomId}`;

        client.subscribe(subDestination, (message) => {
          handleMessageReceived(message); // 3단계 함수 호출
        });
      },

      onStompError: (frame) => {
        console.error("STOMP Error:", frame);
        setIsConnected(false);
      },

      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    // 3. 클라이언트 활성화 (연결 시도 시작)
    client.activate();
    clientRef.current = client; // Ref에 인스턴스 저장

    // 4. Cleanup: 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.deactivate();
      }
    };
  }, [wsUrl, chatroomId, token]);

  // 메시지 수신 및 화면 업데이스 로직
  const handleMessageReceived = (message: IMessage) => {
    try {
      // 1. 메시지 바디는 JSON 문자열이므로 파싱
      const messageBody: ChatMessageProps = JSON.parse(message.body);

      // 2. 메시지 배열 상태 업데이트
      setMessages((prevMessages) => [...prevMessages, messageBody]);

      // TODO: 메시지 스크롤을 맨 아래로 이동시키는 로직 추가
    } catch (e) {
      console.error("메시지 파싱 오류:", e, message.body);
    }
  };

  // 메시지 전송 로직
  const sendMessage = () => {
    const client = clientRef.current;

    // 1. 유효성 검사
    if (!client || !client.connected || !inputMessage.trim()) {
      console.warn("연결되지 않았거나 메시지가 비어있습니다.");
      return;
    }

    // 2. 메시지 생성
    const chatMessage = {
      chatroomId: parseInt(chatroomId), // 백엔드가 number를 요구할 수 있으므로 파싱
      message: inputMessage.trim(),
      senderId: counterpartNickname, // HTML 클라이언트의 senderId 필드와 맞춤
      type: "CHAT",
    };

    // 3. 전송 실행
    client.publish({
      destination: `/app/chat/message`,
      body: JSON.stringify(chatMessage),
      headers: { "content-type": "application/json" },
    });

    // 4. 입력 상태 초기화
    setInputMessage("");
  };

  return (
    <>
      <ChatProductInfo
        auctionId={auctionId}
        auctionImageUrl={auctionImageUrl}
        auctionTitle={auctionTitle}
      />
      <div
        key={chatroomId}
        className="h-[calc(100%-179px)] w-[100%] overflow-x-hidden overflow-y-scroll"
      >
        {messages.map((msg, index) =>
          msg.senderId != buyerId ? (
            <ChatMe
              key={index}
              messageType={msg.messageType}
              message={msg.message}
              createdAt={new Date(msg.createdAt).toLocaleTimeString()}
              isRead={msg.isRead}
            />
          ) : (
            <ChatYou
              key={index}
              counterpartProfileImageUrl={counterpartProfileImageUrl}
              counterpartNickname={counterpartNickname}
              messageType={msg.messageType}
              message={msg.message}
              createdAt={new Date(msg.createdAt).toLocaleTimeString()}
              isRead={msg.isRead}
            />
          )
        )}
      </div>

      <ChatInput
        isConnected={isConnected}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
      />
    </>
  );
};

export default ChatRoom;
