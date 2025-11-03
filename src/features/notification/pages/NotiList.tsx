import React from "react";
import type { NotiModalProps } from "../types/NotiType";
import { formatTime } from "../../../shared/utils/datetime";
import { Bell, Megaphone, TriangleAlert, MessageCircleMore } from "lucide-react";

import api from "../../../shared/api/axiosInstance";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";

interface NotiListPropsWithHandler extends NotiModalProps {
  onChatAdd: (auctionId: number, sellerId: number) => void;
}


const notiList = ({ notis, onChatAdd}: NotiModalProps) => {
  return (
    <ul>
      {notis.map((noti) => (
        <li
          key={Number(noti.notificationId)}
          onClick={() => {
            console.log("🖱️ 클릭됨!", noti);
             if (noti.type === "AUCTION_RESULT" && noti.auctionId && noti.sellerId) {
              onChatAdd(noti.auctionId, noti.sellerId); // ✅ props로 받은 함수 사용
            }
            className = {`border-g400 flex gap-2 border-b p-4 hover:bg-gray-50 ${noti.content.length < 27 && `items-center`}`
          }
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

export default notiList;
