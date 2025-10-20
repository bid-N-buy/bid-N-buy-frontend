import React from "react";
import Avatar from "../../../shared/components/Avatar";
import type { ChatYouProps } from "../types/ChatType";
import { useAuthStore } from "../../auth/store/authStore";

const ChatYou = ({
  msgInfo,
  counterpartInfo,
  sellerId,
  currentPrice,
  auctionInfo,
}: ChatYouProps) => {
  const { message, messageType, read, createdAt } = msgInfo;
  const { counterpartNickname, counterpartProfileImageUrl } = counterpartInfo;
  const { auctionImageUrl, auctionTitle } = auctionInfo;
  const userId = useAuthStore.getState().userId;

  return messageType === "CHAT" && sellerId === userId ? (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : messageType === "REQUEST" ? (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">
            <div className="flex gap-2">
              <img
                src={auctionImageUrl ? auctionImageUrl : ""}
                alt={`${auctionTitle}의 메인 이미지`}
                className="size-15"
              />
              <div className="text-left">
                <p className="font-bold">{auctionTitle}</p>
                <p className="text-g300">{currentPrice.toString()} 원</p>
              </div>
            </div>
            <hr className="bg-g300 my-2 h-[1px] border-0" />
            <div>
              {message}
              <div>
                <button
                  type="button"
                  className="bg-purple mt-2 w-full cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium text-white"
                >
                  결제하기
                </button>
              </div>
            </div>
          </p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">
              {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatYou;
