import { useState, useEffect, useRef } from "react";
import api from "../../../shared/api/axiosInstance";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "../../auth/store/authStore";
import ChatProductInfo from "../components/ChatProductInfo";
import ChatMe from "../components/ChatMe";
import ChatYou from "../components/ChatYou";
import ChatInput from "../components/ChatInput";
// import ChatDate from "../components/ChatDate"; 날짜 넘어갈 시에 사용
import type { ChatRoomProps, ChatMessageProps } from "../types/ChatType";

const ChatRoom = ({
  chatroomId,
  sellerId,
  chatroomInfo,
  productInfo,
}: ChatRoomProps) => {
  // STOMP 클라이언트 인스턴스를 저장하기 위해 useRef 사용 (재렌더링 시에도 값이 유지됨)
  const clientRef = useRef<Client | null>(null);
  // 스크롤 하단 위치 위한 useRef
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  // 토큰/유저아이디 전역에서 들고 오기
  const token = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore.getState().userId;

  // 웹소켓 주소
  const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

  const fetchMessageHistory = async (chatroomId: number, token: string) => {
    try {
      const response = await api.get<ChatMessageProps[]>(
        `/chatrooms/${chatroomId}/message`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load chat log:", error);
      setError(`채팅 로그를 불러올 수 없습니다: ${error}`);
    }
  };

  useEffect(() => {
    if (!token || !chatroomId) return;
    // 이전 메시지 로드
    fetchMessageHistory(chatroomId, token);

    // STOMP 클라이언트 인스턴스 생성
    const client = new Client({
      // SockJS 연결을 사용하기 위한 webSocketFactory 설정
      webSocketFactory: () => {
        return new SockJS(WS_URL);
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

    // 연결 시도
    client.activate();
    clientRef.current = client; // Ref에 인스턴스 저장

    // Cleanup
    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.deactivate();
      }
    };
  }, [WS_URL, chatroomId, token]);

  const handleSendPaymentRequest = (
    auctionId: number,
    buyerId: number,
    sellerId: number,
    currentPrice: number
  ) => {
    const client = clientRef.current;

    // 유효성 검사
    if (!client || !client.connected) {
      console.warn("연결 상태가 좋지 않습니다.");
      return;
    }
    const messagePayload = {
      chatroomId: chatroomId,
      auctionId: auctionId,
      buyerId: buyerId,
      senderId: sellerId,
      message: `${currentPrice}원 결제를 요청합니다.`,
      currentPrice: currentPrice,
      type: "REQUEST",
    };

    // 전송 실행
    client.publish({
      destination: `/app/chat/message`,
      body: JSON.stringify(messagePayload),
      headers: { "content-type": "application/json" },
    });
  };

  // 메시지 수신 및 화면 업데이트 로직
  const handleMessageReceived = (message: IMessage) => {
    try {
      const messageBody: ChatMessageProps = JSON.parse(message.body);

      // 메시지 배열 상태 업데이트
      setMessages((prevMessages) => {
        return [...prevMessages, messageBody];
      });
    } catch (e) {
      console.error("메시지 파싱 오류:", e, message.body);
    }
  };
  // 스크롤
  useEffect(() => {
    chatContainerRef.current!.scrollTop =
      chatContainerRef.current!.scrollHeight;
  }, [messages]);

  // 메시지 전송 로직
  const sendMessage = () => {
    const client = clientRef.current;

    // 유효성 검사
    if (!client || !client.connected || !inputMessage.trim()) {
      console.warn("연결되지 않았거나 메시지가 비어있습니다.");
      return;
    }

    // 메시지 생성
    const chatMessage = {
      chatroomId: chatroomId,
      message: inputMessage.trim(),
      senderId: chatroomInfo.counterpartNickname, // HTML 클라이언트의 senderId 필드와 맞춤
      type: "CHAT",
    };

    // 전송 실행
    client.publish({
      destination: `/app/chat/message`,
      body: JSON.stringify(chatMessage),
      headers: { "content-type": "application/json" },
    });

    // 입력 상태 초기화
    setInputMessage("");
  };

  return (
    <>
      <ChatProductInfo
        auctionInfo={chatroomInfo}
        currentPrice={productInfo.currentPrice}
        sellingStatus={productInfo.sellingStatus}
        handleSendPaymentRequest={handleSendPaymentRequest}
        sellerId={sellerId}
      />
      <div
        ref={chatContainerRef}
        key={chatroomId}
        className="h-[calc(100%-232px)] w-[100%] overflow-x-hidden overflow-y-scroll"
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
              sellerId={sellerId}
              msgInfo={msg}
              auctionInfo={chatroomInfo}
              currentPrice={productInfo.currentPrice}
              handleSendPaymentRequest={handleSendPaymentRequest}
            />
          ) : (
            <ChatYou
              key={index}
              sellerId={sellerId}
              msgInfo={msg}
              counterpartInfo={chatroomInfo}
              auctionInfo={chatroomInfo}
              currentPrice={productInfo.currentPrice}
              handleSendPaymentRequest={handleSendPaymentRequest}
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
