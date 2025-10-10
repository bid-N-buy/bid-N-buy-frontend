import React from "react";

const ChatInput = () => {
  return (
    <div className="bg-white p-4">
      <form className="flex gap-2">
        <input
          type="text"
          name="chatMessage"
          id="chatMessage"
          placeholder="메시지를 입력해 주세요."
          className="border-purple w-[80%] rounded-md border-2 p-2"
        />
        <button
          type="submit"
          className="bg-purple w-[20%] rounded-md py-2 text-white"
        >
          전송
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
