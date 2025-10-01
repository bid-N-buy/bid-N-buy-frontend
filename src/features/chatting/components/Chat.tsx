import React from "react";
import { Link } from "react-router-dom";
import Avatar from "../../../shared/components/Avatar";

const Chat = () => {
  return (
    <Link to="/chat/:id" className="flex items-center gap-2 p-4">
      <Avatar />
      <div>
        <p className="mb-1">
          <span className="font-bold">닉네임</span>{" "}
          <span className="text-xs text-gray-400">date</span>
        </p>
        <p>대화내용</p>
      </div>
    </Link>
  );
};

export default Chat;
