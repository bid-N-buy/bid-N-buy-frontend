import React from "react";
import type { ChatInputProps } from "../types/ChatType";
// import { buildImageUrl } from "../../../shared/utils/imageUrl";
import { Camera } from "lucide-react";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isConnected,
}: ChatInputProps) => {
  const handleKeyDown = (e) => {
    if (e.isComposing) return; // 한글 조합 중이면 무시
    if (e.key === "Enter") {
      sendMessage();
    }
  };
  return (
    <div className="bg-white px-3 py-2">
      <form className="w-full" onSubmit={sendMessage}>
        <input
          type="text"
          name="chatMessage"
          id="chatMessage"
          placeholder="메시지를 입력해 주세요."
          className="border-purple block min-h-15 w-full rounded-md border-2 p-2"
          disabled={!isConnected}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => handleKeyDown() && sendMessage()}
          required
        />
        <div className="mt-2 flex items-center justify-between">
          <button type="button" className="p-2">
            <Camera />
          </button>
          <button
            type="button"
            className="bg-purple w-15 rounded-md py-2 text-white"
            onClick={sendMessage}
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
