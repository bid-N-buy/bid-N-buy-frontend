import React, { useRef, useState } from "react";
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
    // 프로필 이미지를 클릭했을 때 숨겨진 file input 요소를 클릭하도록 연결
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

  // 버튼 통합
  const submitMessage = (e) => {
    e.preventDefault(); // 폼 전송 방지

    if (file) {
      removeImage(); // 이미지 제거 및 input 초기화 함수
      handleSendImage(file);
    } else if (inputMessage.trim()) {
      // 이미지가 없고 텍스트가 있을 때: 일반 메시지 전송
      sendMessage();
    }
  };

  return (
    <div className="bg-white px-3 py-2">
      <form className="w-full" onSubmit={submitMessage}>
        <div
          className={`border-purple relative block min-h-21 w-full rounded-md border-2 p-2 ${preview && `flex gap-2`}`}
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
          <textarea
            name="chatMessage"
            id="chatMessage"
            placeholder={
              preview ? "이미지를 전송합니다." : "메시지를 입력하세요."
            }
            disabled={!isConnected || !!preview}
            className={`h-16 ${preview ? `min-w-[80%]` : `w-full`} focus:outline-none`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()
            }
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
          <button type="button" className="p-2" onClick={handleImageUpload}>
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
  );
};

export default ChatInput;
