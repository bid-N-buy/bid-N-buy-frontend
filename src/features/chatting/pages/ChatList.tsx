import React from "react";
import type { ChatListProps } from "../types/ChatType";
import Avatar from "../../../shared/components/Avatar";
import { formatTime } from "../../../shared/hooks/useCommon";

const ChatList = ({ chatRooms, onSelectRoom }: ChatListProps) => {
  return (
    <ul>
      {chatRooms.map((chat) => (
        <li
          key={chat.chatroomId}
          onClick={() => onSelectRoom(chat.chatroomId)}
          className="border-g400 flex cursor-pointer items-center gap-2 border-b p-4 hover:bg-gray-50"
        >
          <Avatar imageUrl={chat.imageUrl} />
          <div>
            <p className="mb-1">
              <span className="font-bold">{chat.nickname}</span>
              <span className="ml-1 text-xs text-gray-400">
                {chat.createdAt ? formatTime(chat.createdAt) : null}
              </span>
            </p>
            <p>
              {chat.lastMessagePreview
                ? chat.lastMessagePreview.substring(0, 27)
                : "메시지를 보내 보세요."}
              {chat.message && chat.message.length > 27 ? "..." : null}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ChatList;
