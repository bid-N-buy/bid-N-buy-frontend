import React from "react";
import type { NotiModalProps } from "../types/NotiType";
import { formatTime } from "../../../shared/utils/datetime";
import { Bell, Megaphone, TriangleAlert } from "lucide-react";

const notiList = ({ notis }: NotiModalProps) => {
  return (
    <ul className="h-full">
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
