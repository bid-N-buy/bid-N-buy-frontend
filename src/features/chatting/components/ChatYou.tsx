import React from "react";
import Avatar from "../../../shared/components/Avatar";
import type { AvatarProps } from "../../../shared/types/CommonType";

const ChatYou = ({ image_url, nickname }: AvatarProps) => {
  return (
    <div className="mx-2 my-6 flex gap-2">
      <Avatar image_url={image_url} />
      <div>
        <p className="mb-2 font-bold">{nickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">
            대화내용대화내용대화내용대화내용대화내용대화내용대화내용대화내용대화내용대화내용대화내용대화내용대화내용대화내용
          </p>
          <span className="text-g300 mr-1 text-xs">date</span>
          <span className="text-g300 text-xs">읽음</span>
        </div>
      </div>
    </div>
  );
};

export default ChatYou;
