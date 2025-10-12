import React from "react";
import type { ChatMeProps } from "../types/ChatType";

const ChatMe = ({ message, created_at, is_read }: ChatMeProps) => {
  return (
    <div className="mx-2 my-4 flex items-end justify-end gap-2 text-right">
      <div>
        <span className="text-g300 mr-1 text-xs">
          {is_read ? "읽음" : "전송됨"}
        </span>
        <span className="text-g300 text-xs">{created_at}</span>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    </div>
  );
};

export default ChatMe;
