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

  const notiList = ({ notis }: NotiModalProps) => {
    return (
      <ul className="h-full overflow-y-auto">
        {notis.length === 0 && (
          <div className="text-g300 flex h-full items-center justify-center text-sm">
            알림이 없습니다.
          </div>
        )}
        {notis.map((noti) => (
          <li
            key={noti.notificationId}
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
}

export default NotiList;
