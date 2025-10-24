import React, { useRef, useState, type FormEvent } from "react";
import type { ChatInputProps } from "../types/ChatType";
import { Camera, X } from "lucide-react";

const ChatInput = ({
  inputMessage,
  setInputMessage,
  sendMessage,
  isConnected,
  handleSendImage,
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // 파일 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    if (file) {
      const newImage = window.URL.createObjectURL(file);
      setPreview(newImage);
      setFile(file);
    } else {
      // 사용자가 파일 선택 창을 닫았을 때
      setPreview(null);
      setFile(null);
    }
  };

  // 버튼과 실제 인풋 간 연결
  const handleImageUpload = () => {
    // 버튼을 클릭했을 때 숨겨진 file input 요소를 클릭하도록 연결
    fileInputRef.current?.click();
  };

  // 프리뷰 및 올려진 파일 삭제
  const removeImage = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitMessage = (e: FormEvent) => {
    e.preventDefault();
    if (file) {
      removeImage(); // 이미지 제거 및 input 초기화 함수
      handleSendImage(file);
    } else if (inputMessage.trim()) {
      sendMessage();
    }
  };

  return (
    <div className="relative">
      {preview && (
        <div className="absolute -top-[5rem] ml-1 size-[20%]">
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
      <div className="bg-white px-3 py-2">
        <form className="w-full" onSubmit={submitMessage}>
          <div
            className={`border-purple relative block w-full rounded-md border-2 p-2 ${preview && `flex gap-2`}`}
          >
            <input
              type="text"
              name="chatMessage"
              id="chatMessage"
              placeholder={
                preview ? "사진을 전송합니다." : "메시지를 입력하세요."
              }
              disabled={!isConnected || !!preview}
              className="w-full focus:outline-none"
              value={preview ? "" : inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              // onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing}
              style={{ resize: "none" }}
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
            <button
              type="button"
              className="cursor-pointer p-2"
              onClick={handleImageUpload}
            >
              <Camera />
            </button>
            <button
              type="submit"
              className="bg-purple w-15 rounded-md py-2 text-white"
            >
              전송
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
