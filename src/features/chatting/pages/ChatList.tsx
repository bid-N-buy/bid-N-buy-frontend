import React from "react";
import type { ChatListProps } from "../types/ChatType";
import Avatar from "../../../shared/components/Avatar";
import { formatTime } from "../../../shared/hooks/useCommon";

const ChatList = ({ chatRooms, onSelectRoom }: ChatListProps) => {
  return (
    <ul>
      {chatRooms.map((chat) => (
        <li
          key={chat.chatroom_id}
          onClick={() => onSelectRoom(chat.chatroom_id)}
          className="border-g400 flex cursor-pointer items-center gap-2 border-b p-4 hover:bg-gray-50"
        >
          <Avatar image_url={chat.image_url} />
          <div>
            <p className="mb-1">
              <span className="font-bold">{chat.nickname}</span>
              <span className="ml-1 text-xs text-gray-400">
                {formatTime(chat.created_at)}
              </span>
            </p>
            <p>
              {chat.message.substring(0, 27)}
              {chat.message.length > 27 ? "..." : null}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ChatList;
