import React from "react";

const ChatMe = () => {
  return (
    <div className="mx-2 my-4 flex items-end justify-end gap-2 text-right">
      <div>
        <span className="text-g300 mr-1 text-xs">읽음</span>
        <span className="text-g300 text-xs">time</span>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">메세지</div>
    </div>
  );
};

export default ChatMe;
