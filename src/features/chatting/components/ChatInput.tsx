import React, { useRef, useState } from "react";
import type { ChatInputProps } from "../types/ChatType";
import { Camera, X } from "lucide-react";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isConnected,
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (file) {
      const image = window.URL.createObjectURL(file);
      setPreview(image);
      setFile(file);
    }
  };

  const handleImageUpload = () => {
    // 프로필 이미지를 클릭했을 때 숨겨진 file input 요소를 클릭하도록 연결
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
  };

  return (
    <div className="bg-white px-3 py-2">
      <form className="w-full" onSubmit={sendMessage}>
        <div
          className={`border-purple relative block min-h-17 w-full rounded-md border-2 p-2 ${preview && `flex gap-2`}`}
        >
          {preview && (
            <div className="relative w-[20%]">
              <img className="w-full" src={preview} />
              <button
                type="button"
                className="absolute top-0 right-0 bg-white"
                onClick={removeImage}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input
            type="text"
            name="chatMessage"
            id="chatMessage"
            placeholder="메시지를 입력해 주세요."
            disabled={!isConnected}
            className={`h-11 ${preview ? `min-w-[80%]` : `w-full`} focus:outline-none`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()
            }
            required
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <input
            id="image"
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button type="button" className="p-2" onClick={handleImageUpload}>
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
