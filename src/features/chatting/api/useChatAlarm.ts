// import { useEffect, useRef } from "react";
// import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
// import { useAuthStore } from "../../auth/store/authStore";

// const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;
// let globalStompClient: Client | null = null;

// interface UseChatAlarmProps {
//   userId: number;
//   chatroomIds: string[];
//   onMessage: (chatroomId: string, msg: any) => void;
//   enabled?: boolean;
// }

// export function useMultiChatSocket({
//   userId,
//   chatroomIds,
//   onMessage,
//   enabled = true,
// }: UseChatAlarmProps) {
//   const subscriptionsRef = useRef<Record<string, StompSubscription>>({});

//   // 토큰 전역에서 들고 오기
//   const token = useAuthStore((state) => state.accessToken);

//   useEffect(() => {
//     if (!enabled || !userId || !chatroomIds.length) return;
//     if (!globalStompClient) {
//       globalStompClient = new Client({
//         brokerURL: WS_URL,
//         connectHeaders: {
//           Authorization: `Bearer ${token}`,
//         },
//         reconnectDelay: 0,
//         onConnect: () => {
//           // 연결 성공 시 각 방 구독
//           chatroomIds.forEach((chatroomId) => {
//             const topic = `/chatrooms/${chatroomId}`;
//             if (!subscriptionsRef.current[chatroomId]) {
//               subscriptionsRef.current[chatroomId] =
//                 globalStompClient!.subscribe(topic, (message: IMessage) => {
//                   try {
//                     const data = JSON.parse(message.body);
//                     onMessage(chatroomId, data);
//                   } catch (e) {
//                     console.log(e);
//                   }
//                 });
//             }
//           });
//         },
//       });
//       globalStompClient.activate();
//     } else if (globalStompClient.connected) {
//       // 이미 연결되어 있으면 바로 구독
//       chatroomIds.forEach((chatroomId) => {
//         const topic = `/sub/count/chat-rooms/${userId}/${chatroomId}`;
//         if (!subscriptionsRef.current[chatroomId]) {
//           subscriptionsRef.current[chatroomId] = globalStompClient!.subscribe(
//             topic,
//             (message: IMessage) => {
//               try {
//                 const data = JSON.parse(message.body);
//                 onMessage(chatroomId, data);
//               } catch (e) {
//                 console.log(e);
//               }
//             }
//           );
//         }
//       });
//     } else {
//       globalStompClient.activate();
//     }
//     // 해제 로직
//     return () => {
//       Object.values(subscriptionsRef.current).forEach((sub) =>
//         sub.unsubscribe()
//       );
//       subscriptionsRef.current = {};
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [userId, chatroomIds.join(","), enabled]);
// }
