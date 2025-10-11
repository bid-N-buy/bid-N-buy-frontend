import React from "react";
import ChatProductInfo from "../components/ChatProductInfo";
import ChatMe from "../components/ChatMe";
import ChatYou from "../components/ChatYou";
import ChatInput from "../components/ChatInput";
import type { ChatRoomProps } from "../types/ChatType";
import ChatDate from "../components/ChatDate";

// Pick을 통해 필요한 값만 채택하여 새로운 타입 정의
type ChatRoomComponentProps = Pick<ChatRoomProps, "nickname" | "image_url"> & {
  // roomId는 ChatModal에서 string으로 변환되어 오므로 string으로 명시
  roomId: string;
};

const ChatRoom = ({ roomId, image_url, nickname }: ChatRoomComponentProps) => {
  return (
    <>
      <ChatProductInfo />
      <div
        key={roomId}
        className="h-[calc(100%-179px)] w-[100%] overflow-x-hidden overflow-y-scroll"
      >
        <ChatMe />
        <ChatYou image_url={image_url} nickname={nickname} />
        <ChatMe />
        <ChatMe />
        <ChatMe />
        <ChatDate />
        <ChatMe />
        <ChatYou image_url={image_url} nickname={nickname} />
        <ChatYou image_url={image_url} nickname={nickname} />
        <ChatYou image_url={image_url} nickname={nickname} />
        <ChatYou image_url={image_url} nickname={nickname} />
        <ChatYou image_url={image_url} nickname={nickname} />
        <ChatYou image_url={image_url} nickname={nickname} />
      </div>
      <ChatInput />
    </>
  );
};

export default ChatRoom;
