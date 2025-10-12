import React from "react";
import type { ChatInputProps } from "../types/ChatType";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isConnected,
}: ChatInputProps) => {
  return (
    <div className="bg-white p-4">
      <form className="flex gap-2" onSubmit={sendMessage}>
        <input
          type="text"
          name="chatMessage"
          id="chatMessage"
          placeholder="메시지를 입력해 주세요."
          className="border-purple w-[80%] rounded-md border-2 p-2"
          disabled={!isConnected}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          required
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
