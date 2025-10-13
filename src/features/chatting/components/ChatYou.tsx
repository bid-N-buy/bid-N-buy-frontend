import React from "react";
import Avatar from "../../../shared/components/Avatar";
import type { ChatYouProps } from "../types/ChatType";

const ChatYou = ({
  imageUrl,
  nickname,
  messageType,
  message,
  createdAt,
  isRead,
}: ChatYouProps) => {
  return messageType === "chat" ? (
    <div className="mx-2 my-6 flex gap-2">
      <Avatar imageUrl={imageUrl} />
      <div>
        <p className="mb-2 font-bold">{nickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <span className="text-g300 mr-1 text-xs">{createdAt}</span>
          <span className="text-g300 text-xs">
            {isRead ? "읽음" : "전송됨"}
          </span>
        </div>
      </div>
    </div>
  ) : messageType === "request" ? (
    <div className="mx-2 my-6 flex gap-2">
      <Avatar imageUrl={imageUrl} />
      <div>
        <p className="mb-2 font-bold">{nickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <span className="text-g300 mr-1 text-xs">{createdAt}</span>
          <span className="text-g300 text-xs">
            {isRead ? "읽음" : "전송됨"}
          </span>
        </div>
      </div>
    </div>
  ) : (
    <div className="mx-2 my-6 flex gap-2">
      <Avatar imageUrl={imageUrl} />
      <div>
        <p className="mb-2 font-bold">{nickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <span className="text-g300 mr-1 text-xs">{createdAt}</span>
          <span className="text-g300 text-xs">
            {isRead ? "읽음" : "전송됨"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatYou;
