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
  // const images = [];
  // const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // // *****파일 선택 핸들러 - 수정
  // const onFilesSelected = (files: File[]) => {
  //   const room = Math.max(0, 10 - images.length);

  //   // 원본 파일도 보관
  //   setSelectedFiles((prev) => [...prev, ...taking]);
  // };

  // const onRemoveImage = (idx: number) => {
  //   const target = images[idx];
  //   if (target?.imageUrl.startsWith("blob:"))
  //     URL.revokeObjectURL(target.imageUrl);
  //   removeImage(idx);
  //   setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  // };

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
          onKeyDown={(e) =>
            e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()
          }
          required
        />
        <div className="mt-2 flex items-center justify-between">
          {/* <input
            id="images"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={images.length >= 1}
            onChange={(e) => onFilesSelected(Array.from(e.target.files ?? []))}
          /> */}
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
