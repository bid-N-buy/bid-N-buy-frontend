import React from "react";
import Avatar from "../../../shared/components/Avatar";

const Chat = () => {
  return (
    <div className="flex items-center gap-2">
      <Avatar />
      <div>
        <p>
          <span className="font-medium">닉네임</span>{" "}
          <span className="text-sm">time</span>
        </p>
        <p>대화내용</p>
      </div>
    </div>
  );
};

export default Chat;
