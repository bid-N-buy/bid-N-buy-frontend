import React from "react";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatMeProps } from "../types/ChatType";

const ChatMe = ({
  msgInfo,
  sellerId,
  currentPrice,
  auctionInfo,
}: ChatMeProps) => {
  const { message, messageType, read, createdAt } = msgInfo;
  const { auctionImageUrl, auctionTitle } = auctionInfo;
  const userId = useAuthStore.getState().userId;
  const isSenderSeller = sellerId === userId;

  return messageType === "CHAT" ? (
    <div className="m-2 flex items-end justify-end gap-2 text-right">
      <div>
        <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
        <p className="text-g300 text-xs">
          {new Date(createdAt).toLocaleTimeString()}
        </p>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    </div>
  ) : messageType === "REQUEST" && isSenderSeller ? (
    <div className="m-2 flex items-end justify-end gap-2 text-right">
      <div>
        <p className="text-g300 text-xs">{read ? "" : "전송됨"}</p>
        <p className="text-g300 text-xs">
          {new Date(createdAt).toLocaleTimeString()}
        </p>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">
        <div className="flex gap-2">
          <img
            src={auctionImageUrl ? auctionImageUrl : ""}
            alt={`${auctionTitle}의 메인 이미지`}
          />
          <div>
            <p className="font-bold">{auctionTitle}</p>
            <p className="text-g300">{currentPrice.toString()}</p>
          </div>
        </div>
        <hr />
        <div>{message}</div>
      </div>
    </div>
  ) : (
    <div className="m-2 flex items-end justify-end gap-2 text-right">
      <div>
        <p className="text-g300 text-xs">{read ? "" : "전송됨"}</p>
        <p className="text-g300 text-xs">
          {new Date(createdAt).toLocaleTimeString()}
        </p>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    </div>
  );
};

export default ChatMe;
