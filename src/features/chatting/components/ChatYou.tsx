import React from "react";
import Avatar from "../../../shared/components/Avatar";
import type { ChatYouProps } from "../types/ChatType";

const ChatYou = ({
  image_url,
  nickname,
  message_type,
  message,
  created_at,
  is_read,
}: ChatYouProps) => {
  return message_type === "chat" ? (
    <div className="mx-2 my-6 flex gap-2">
      <Avatar image_url={image_url} />
      <div>
        <p className="mb-2 font-bold">{nickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <span className="text-g300 mr-1 text-xs">{created_at}</span>
          <span className="text-g300 text-xs">
            {is_read ? "읽음" : "전송됨"}
          </span>
        </div>
      </div>
    </div>
  ) : message_type === "request" ? (
    <div className="mx-2 my-6 flex gap-2">
      <Avatar image_url={image_url} />
      <div>
        <p className="mb-2 font-bold">{nickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <span className="text-g300 mr-1 text-xs">{created_at}</span>
          <span className="text-g300 text-xs">
            {is_read ? "읽음" : "전송됨"}
          </span>
        </div>
      </div>
    </div>
  ) : (
    <div className="mx-2 my-6 flex gap-2">
      <Avatar image_url={image_url} />
      <div>
        <p className="mb-2 font-bold">{nickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <span className="text-g300 mr-1 text-xs">{created_at}</span>
          <span className="text-g300 text-xs">
            {is_read ? "읽음" : "전송됨"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatYou;
