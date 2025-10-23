import { useState, useEffect, useRef } from "react";
import api from "../../../shared/api/axiosInstance";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import { useChatListApi } from "../api/useChatList";
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

  const { markAsRead } = useChatModalStore();
  const { refetchList } = useChatListApi();

  // 웹소켓 주소
  const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

  useEffect(() => {
    if (!token || !chatroomId) return;

    fetchMessageHistory(chatroomId, token);
    webSocketLogic();

    // Cleanup
    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.deactivate();
      }
    };
  }, [chatroomId, token]);

  useEffect(() => {
    if (!chatroomId || !userId || !isConnected) {
      return;
    }
    if (messages.length === 0) {
      console.log("메시지 기록이 없어 읽음 요청을 건너뜁니다.");
      return;
    }
    sendReadStatus();
  }, [chatroomId, userId, isConnected, messages.length]);

  // 이전 메시지 로드
  const fetchMessageHistory = async (chatroomId: number, token: string) => {
    try {
      const response = await api.get(`/chatrooms/${chatroomId}/message`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load chat log:", error);
      setError(`채팅 로그를 불러올 수 없습니다: ${error}`);
    }
  };

  // 웹소켓 전체 로직
  const webSocketLogic = () => {
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
        setIsConnected(true);

        // 연결 성공 시 채팅방 구독
        const receivedDestination = `/topic/chat/room/${chatroomId}`;
        const readDestination = `/topic/chat/readstatus/${chatroomId}`;

        client.subscribe(receivedDestination, (message) => {
          handleMessageReceived(message); // 화면 변경
        });

        client.subscribe(readDestination, (readMessage) => {
          console.log("읽음 처리 중"); // 🚨 이 로그가 찍혀야 실시간 반영이 시작됩니다.
          try {
            const readData = JSON.parse(readMessage.body);
            console.log("서버에서 받은 읽음 데이터:", readData);

            // 💡 [핵심 변수] 서버가 알려준 새로 읽음 처리된 메시지 개수
            const countToUpdate = readData.updatedCount;

            // 서버 알림을 받아 setMessages로 화면 갱신 (송신자 화면)
            setMessages((prevMessages) => {
              let messagesUpdated = 0; // 실제로 업데이트된 메시지 개수 카운터

              // 1. 메시지 배열을 복사하고 역순으로 순회 (최신 메시지부터 처리)
              return prevMessages
                .slice()
                .reverse()
                .map((msg) => {
                  // 2. [조건] 업데이트할 개수가 남아있고, 아직 읽지 않았으며, 상대방이 읽은 상태를 표시해야 하는 메시지(보통 내가 보낸 메시지)라면
                  if (messagesUpdated < countToUpdate && !msg.read) {
                    messagesUpdated++;
                    // 3. 읽음 처리 후 리턴
                    return { ...msg, read: true };
                  }
                  // 4. 나머지 메시지는 그대로 유지
                  return msg;
                })
                .reverse(); // 5. 순서를 원래대로 되돌립니다.
            });
          } catch (e) {
            console.error("읽음 상태 파싱 오류:", e);
          }
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
    clientRef.current = client;
  };

  // 메시지 수신 및 화면 업데이트 로직
  const handleMessageReceived = (message: IMessage) => {
    try {
      const messageBody = JSON.parse(message.body);
      // 메시지 배열 상태 업데이트
      setMessages((prevMessages) => {
        return [...prevMessages, messageBody];
      });
    } catch (e) {
      console.error("메시지 파싱 오류:", e, message.body);
    }
  };
  // 새 메시지 생길 시 자동 스크롤 이동
  useEffect(() => {
    chatContainerRef.current!.scrollTop =
      chatContainerRef.current!.scrollHeight;
  }, [messages]);

  // [전송] 주소 입력 완료 알림
  const handleSendAddress = (
    auctionId: number,
    buyerId: number,
    sellerId: number
  ) => {
    const client = clientRef.current;

    // 유효성 검사
    if (!client || !client.connected) {
      console.warn("연결 상태가 좋지 않습니다.");
      return;
    }
    const messageAddress = {
      chatroomId: chatroomId,
      auctionId: auctionId,
      buyerId: buyerId,
      senderId: sellerId,
      message: "주소를 입력했습니다.",
      messageType: "SYSTEM",
    };

    // 전송 실행
    client.publish({
      destination: `/app/chat/message`,
      body: JSON.stringify(messageAddress),
      headers: { "content-type": "application/json" },
    });
  };

  // [전송] 거래 요청 메시지
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
      messageType: "REQUEST",
    };

    // 전송 실행
    client.publish({
      destination: `/app/chat/message`,
      body: JSON.stringify(messagePayload),
      headers: { "content-type": "application/json" },
    });
  };

  // [전송] 이미지 메시지
  const handleSendImage = async (file: File) => {
    const client = clientRef.current;

    if (!client || !client.connected) {
      console.warn("연결 상태가 좋지 않습니다.");
      return;
    }

    // 받아올 url 정의
    let uploadedImageUrl: string;
    const messageText = "사진을 보냈습니다.";

    try {
      // 폼 데이터로 전송(요청 파라미터)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("messageText", messageText);

      const url = await api.post(`/chat/${chatroomId}/image`, formData, {
        headers: {
          "content-type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      uploadedImageUrl = url.data;
    } catch (e) {
      console.error("이미지 업로드 실패:", e);
      return;
    }

    const messageImage = {
      chatroomId: chatroomId,
      senderId: userId,
      imageUrl: uploadedImageUrl,
      messageType: "IMAGE",
    };

    client.publish({
      destination: `/app/chat/message`,
      body: JSON.stringify(messageImage),
      headers: { "content-type": "application/json" },
    });
  };

  // [전송] 채팅(기본) 메시지
  const sendMessage = () => {
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
  };

  // [전송] 읽음 상태
  const sendReadStatus = async () => {
    const lastMessage = messages[messages.length - 1];
    const lastReadMessageId = lastMessage.chatmessageId;

    if (
      !token ||
      !chatroomId ||
      !lastMessage ||
      lastMessage.senderId === userId
    )
      return;

    try {
      await api.put(
        `/chat/${chatroomId}/read`,
        { lastReadMessageId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      markAsRead(chatroomId);
      await refetchList();
      console.log("채팅 읽음 상태 전송 및 채팅 목록 갱신 완료");
    } catch (error) {
      console.error("읽음 상태 전송 실패:", error);
    }
  };

  return (
    <>
      <ChatProductInfo
        auctionInfo={chatroomInfo}
        sellerId={sellerId}
        currentPrice={productInfo.currentPrice}
        sellingStatus={productInfo.sellingStatus}
        handleSendPaymentRequest={handleSendPaymentRequest}
        handleSendAddress={handleSendAddress}
      />
      <div
        ref={chatContainerRef}
        key={chatroomId}
        className="h-[calc(100%-15.4rem)] w-[100%] overflow-x-hidden overflow-y-scroll"
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
            />
          ) : (
            <ChatYou
              key={index}
              sellerId={sellerId}
              msgInfo={msg}
              counterpartInfo={chatroomInfo}
              auctionInfo={chatroomInfo}
              currentPrice={productInfo.currentPrice}
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
