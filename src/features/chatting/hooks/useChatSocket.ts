import React, { useCallback, useRef, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatMessageProps } from "../types/ChatType";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";

export const useChatSocket = (chatroomId: number) => {
  // STOMP 클라이언트 인스턴스를 저장하기 위해 useRef 사용 (재렌더링 시에도 값이 유지됨)
  const clientRef = useRef<Client | null>(null);

  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  // 토큰/유저아이디 전역에서 들고 오기
  const token = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore.getState().userId;

  const { markAsRead, handleNewChatMessage } = useChatModalStore();

  // 웹소켓 주소
  const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

  // 이전 메시지 로드
  const fetchMessageHistory = useCallback(
    async (chatroomId: number, token: string) => {
      try {
        const response = await api.get(`/chatrooms/${chatroomId}/message`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMessages(response.data);
      } catch (error) {
        console.error("채팅 로그 불러오기 실패:", error);
        setError(`채팅 로그를 불러올 수 없습니다: ${error}`);
      }
    },
    []
  );

  // 웹소켓 전체 로직
  const webSocketLogic = useCallback(() => {
    if (clientRef.current?.connected) {
      return;
    }

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
          try {
            const newMessage: ChatMessageProps = JSON.parse(message.body);
            handleMessageReceived(message); // 화면 변경
            handleNewChatMessage(newMessage); // 실시간 전체 메시지 읽음 상태 관리
          } catch (e) {
            console.error("메시지 실시간 상태 오류:", e);
            return;
          }
        });

        client.subscribe(readDestination, (readMessage) => {
          try {
            const readData = JSON.parse(readMessage.body);
            // 서버가 알려준 새로 읽음 처리된 메시지 개수
            const countToUpdate = readData.updatedCount;

            // 화면 갱신
            setMessages((prevMessages) => {
              let messagesUpdated = 0; // 실제로 업데이트된 메시지 개수 카운터
              // 최신 메시지부터 처리하기 위해 역순
              return prevMessages
                .slice()
                .reverse()
                .map((msg) => {
                  if (messagesUpdated < countToUpdate && !msg.read) {
                    messagesUpdated++;
                    return { ...msg, read: true };
                  }
                  return msg;
                })
                .reverse();
            });
          } catch (e) {
            console.error("읽음 상태 파싱 오류:", e);
            return;
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP Error:", frame);
        setIsConnected(false);
        return;
      },

      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    // 연결 시도
    client.activate();
    clientRef.current = client;
  }, [WS_URL, chatroomId, token, handleNewChatMessage]);

  // 메시지 수신 및 화면 업데이트 로직
  const handleMessageReceived = (message: IMessage) => {
    try {
      const messageBody = JSON.parse(message.body);
      setMessages((prevMessages) => {
        return [...prevMessages, messageBody];
      });
    } catch (e) {
      console.error("메시지 파싱 오류:", e, message.body);
      return;
    }
  };

  // [전송] 주소 입력 메시지
  const handleSendAddress = async (address: string) => {
    const client = clientRef.current;

    // 유효성 검사
    if (!client || !client.connected) {
      console.warn("연결 상태가 좋지 않습니다.");
      return;
    }

    const messageAddress = {
      chatroomId: chatroomId,
      senderId: userId,
      message: address,
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

    const messageText = "사진을 보냈습니다.";

    try {
      // 폼 데이터로 전송(요청 파라미터)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("messageType", "IMAGE");
      formData.append("messageText", messageText);

      const response = await api.post(`/chat/${chatroomId}/image`, formData, {
        headers: {
          // "content-type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = response.data;

      const messageImage = {
        chatroomId: chatroomId,
        senderId: userId,
        imageUrl: imageUrl,
        messageType: "IMAGE",
        message: messageText,
      };

      client.publish({
        destination: `/app/chat/message`,
        body: JSON.stringify(messageImage),
        headers: {
          "content-type": "application/json",
        },
      });
    } catch (e) {
      console.error("이미지 업로드 실패:", e);
      return;
    }
  };

  // [전송] 읽음 상태
  const sendReadStatus = useCallback(async () => {
    const latestUnreadMessage = messages
      .slice() // 배열 복사
      .reverse() // 최신 메시지부터 탐색
      .find((msg) => msg.senderId !== userId && !msg.read);

    if (!latestUnreadMessage) {
      return;
    }

    const lastUnreadMessageId = latestUnreadMessage.chatmessageId;

    if (!token || !chatroomId) return;

    try {
      await api.put(
        `/chat/${chatroomId}/read`,
        { lastUnreadMessageId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      markAsRead(chatroomId);
    } catch (e) {
      console.error("읽음 상태 전송 실패:", e);
      return;
    }
  }, [chatroomId, markAsRead, messages, token, userId]);

  return {
    clientRef,
    messages,
    isConnected,
    error,
    webSocketLogic,
    fetchMessageHistory,
    handleSendPaymentRequest,
    handleSendAddress,
    handleSendImage,
    sendReadStatus,
  };
};
