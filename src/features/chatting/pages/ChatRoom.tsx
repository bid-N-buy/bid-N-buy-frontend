import React from "react";
import ChatMe from "../components/ChatMe";
import ChatYou from "../components/ChatYou";
import ChatInput from "../components/ChatInput";
import type { ChatRoomProps } from "../types/ChatType";

// Pick을 통해 필요한 값만 채택하여 새로운 타입 정의
type ChatRoomComponentProps = Pick<ChatRoomProps, "nickname" | "image_url"> & {
  // roomId는 ChatModal에서 string으로 변환되어 오므로, string으로 명시
  roomId: string;
};

const ChatRoom = ({ roomId, image_url, nickname }: ChatRoomComponentProps) => {
  return (
    <>
      <div key={roomId} className="h-[calc(100%-76px)] overflow-y-scroll">
        <ChatMe />
        <ChatYou image_url={image_url} nickname={nickname} />
        <ChatMe />
        <ChatMe />
        <ChatMe />
        <ChatMe />
      </div>
      <ChatInput />
    </>
  );
};

export default ChatRoom;
