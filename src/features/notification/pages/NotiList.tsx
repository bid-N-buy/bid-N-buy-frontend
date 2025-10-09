import React from "react";
import type { NotiProps } from "../types/NotiType";
import { formatTime } from "../../../shared/hooks/useCommon";
import { Bell, Megaphone } from "lucide-react";

const notiList = () => {
  // 실제 사용될 더미 데이터
  const Notis: NotiProps[] = [
    {
      notification_id: BigInt(101),
      type: "alert",
      content: "안녕하세요.",
      created_at: Date(),
      is_read: false,
      deleted_at: "x",
    },
    {
      notification_id: BigInt(102),
      type: "alert",
      content: "네고 가능할까요?",
      created_at: Date(),
      is_read: false,
      deleted_at: "x",
    },
    // ...
  ];
  return (
    <ul>
      {Notis.map((noti) => (
        <li
          key={noti.notification_id.toString()}
          onClick={() => noti.notification_id}
          className="flex cursor-pointer items-center gap-2 border-b p-4 hover:bg-gray-50"
        >
          {noti.type === "alert" ? <Bell /> : <Megaphone />}
          <div>
            <p className="mb-1">
              <span className="ml-1 text-xs text-gray-400">
                {formatTime(noti.created_at)}
              </span>
            </p>
            <p>{noti.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default notiList;
