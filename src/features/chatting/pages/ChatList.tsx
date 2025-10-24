import React from "react";
import type { ChatListProps } from "../types/ChatType";
import Avatar from "../../../shared/components/Avatar";
import { formatTime } from "../../../shared/hooks/useCommon";

const ChatList = ({ chatList, onSelectRoom }: ChatListProps) => {
  return (
    <ul className="h-full">
      {chatList.length === 0 && (
        <div className="text-g300 flex h-full items-center justify-center text-sm">
          개설된 채팅방이 없습니다.
        </div>
      )}
      {chatList.map((chat) => (
        <li
          key={chat.chatroomId}
          onClick={() => onSelectRoom(chat.chatroomId)}
          className="border-g400 flex cursor-pointer items-center justify-between border-b p-4 hover:bg-gray-50"
        >
          <div className="flex gap-2">
            <Avatar imageUrl={chat.counterpartProfileImageUrl} />
            <div>
              <p className="mb-1">
                <span className="font-bold">{chat.counterpartNickname}</span>
                <span className="ml-1 text-xs text-gray-400">
                  {chat.lastMessageTime
                    ? formatTime(chat.lastMessageTime)
                    : null}
                </span>
              </p>
              <p>
                {chat.lastMessagePreview
                  ? chat.lastMessagePreview.substring(0, 27)
                  : "메시지를 보내 보세요."}
                {chat.lastMessagePreview && chat.lastMessagePreview.length > 27
                  ? "..."
                  : null}
              </p>
            </div>
          </div>
          {chat.unreadCount > 0 && (
            <div className="bg-red rounded-full px-2.5 py-1 text-center text-xs text-white">
              {chat.unreadCount}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default ChatList;
