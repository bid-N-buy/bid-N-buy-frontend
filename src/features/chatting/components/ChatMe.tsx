import React from "react";
import type { ChatMessageProps } from "../types/ChatType";

type ChatMeProps = Pick<ChatMessageProps, "created_at" | "message" | "is_read">;

const ChatMe = ({ message, created_at }: ChatMeProps) => {
  return (
    <div className="mx-2 my-4 flex items-end justify-end gap-2 text-right">
      <div>
        <span className="text-g300 mr-1 text-xs">읽음</span>
        <span className="text-g300 text-xs">{created_at}</span>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    </div>
  );
};

export default ChatMe;
