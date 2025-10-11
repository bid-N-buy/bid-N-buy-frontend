import React from "react";
import type { NotiModalProps } from "../types/NotiType";
import { formatTime } from "../../../shared/hooks/useCommon";
import { Bell, Megaphone, TriangleAlert } from "lucide-react";

const notiList = ({ notis }: NotiModalProps) => {
  return (
    <ul>
      {notis.map((noti) => (
        <li
          key={noti.notification_id.toString()}
          className="border-g400 flex gap-2 border-b p-4 hover:bg-gray-50"
        >
          {noti.type === "alert" ? (
            <Bell />
          ) : noti.type === "notice" ? (
            <Megaphone />
          ) : (
            <TriangleAlert />
          )}
          <div className="w-[90%]">
            <p className="mb-1 text-xs text-gray-400">
              {formatTime(noti.created_at)}
            </p>
            <p>{noti.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default notiList;
