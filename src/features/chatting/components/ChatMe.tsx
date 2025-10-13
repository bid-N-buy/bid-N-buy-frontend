import React from "react";
import type { ChatMeProps } from "../types/ChatType";

const ChatMe = ({
  message,
  createdAt,
  messageType,
  isRead,
  paymentId,
}: ChatMeProps) => {
  return (
    <div className="mx-2 my-4 flex items-end justify-end gap-2 text-right">
      <div>
        <span className="text-g300 mr-1 text-xs">
          {isRead ? "읽음" : "전송됨"}
        </span>
        <span className="text-g300 text-xs">{createdAt}</span>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    </div>
  );
};

export default ChatMe;
