import React, { useState } from "react";
import type { ProductCardProps } from "../../auction/types/product";
import type { ChatRoomProps } from "../types/ChatType";

type ChatProductInfoProps = Pick<ChatRoomProps, "auction_id"> &
  Pick<ProductCardProps, "title" | "currentPrice" | "mainImageUrl">;

const ChatProductInfo = ({
  auction_id,
  title,
  currentPrice,
  mainImageUrl,
}: ChatProductInfoProps) => {
  const [mode, setMode] = useState<string>("sell");

  return (
    <div
      key={auction_id}
      className="bg-light-purple flex justify-between gap-2 p-4"
    >
      <div className="bg-g300 size-15">
        <img className="w-100" src={mainImageUrl ? mainImageUrl : ""} />
      </div>
      <div className="flex w-[72%] flex-col gap-1 text-sm md:w-[60%]">
        <p className="font-bold">{title}</p>
        <p className="text-xs">
          판매물품 설명~~판매물품 설명~~
          {/* 추후 substring(0, 30) 처리 */}
        </p>
        <p className="text-g300">{currentPrice}</p>
      </div>
      <div className="flex w-[15%] flex-col gap-2">
        <button
          type="button"
          className="bg-purple w-full rounded-md px-2 py-1.5 text-xs text-white"
        >
          결제 요청
        </button>
        {mode === "sell" && (
          <button
            type="button"
            className="bg-purple w-full rounded-md px-2 py-1.5 text-xs text-white"
          >
            주소 입력
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatProductInfo;
