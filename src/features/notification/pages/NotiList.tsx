import React from "react";
import { formatTime } from "../../../shared/utils/datetime";
import { Bell, Megaphone, TriangleAlert, MessageCircleMore } from "lucide-react";

import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import type { NotiModalProps } from "../types/NotiType";

const NotiList = ({ notis, onChatAdd }: NotiModalProps) => {
  
  const token = useAuthStore((s) => s.accessToken);
  const { makeChatRoomInAuc, openChatRoom } = useChatModalStore();

  const handleChatAdd = async (auctionId: number, sellerId: number) => {
    if (!token) return;

    try {
      const response = await api.post(
        `/chatrooms/${auctionId}`,
        { sellerId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const chatroomId = response.data.chatroomId;
      await makeChatRoomInAuc(token, sellerId, auctionId);
      openChatRoom(chatroomId);
    } catch (error) {
      console.error("❌ 채팅방 생성 실패:", error);
    }
  };

  return (
    <ul>
      {notis.map((noti) => (
        <li
          key={noti.notificationId}
          onClick={() => {
            console.log("🖱️ [알림 클릭됨]:", noti);
            if (noti.auctionId && noti.sellerId) {
              handleChatAdd(noti.auctionId, noti.sellerId);
            } else {
              console.warn("⚠️ [FCM] 채팅 생성 정보 부족:", noti);
            }
          }}
          className={`border-g400 flex gap-2 border-b p-4 hover:bg-gray-50 ${noti.content.length < 27 && `items-center`}`}
        >
          {noti.type.toLowerCase() === "alert" ? (
            <Bell />
          ) : noti.type.toLowerCase() === "notice" ? (
            <Megaphone />
          ) : noti.type.toLowerCase() === "auction_result" ? (
            <MessageCircleMore />
          ) : (
            <TriangleAlert />
          )}
          <div className="w-[90%]">
            <p className="mb-1 text-xs text-gray-400">
              {formatTime(noti.createdAt)}
            </p>
            <p>{noti.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default NotiList;
