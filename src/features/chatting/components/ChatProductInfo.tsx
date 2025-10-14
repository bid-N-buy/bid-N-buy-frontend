import React, { useState } from "react";
import type { ChatProductInfoProps } from "../types/ChatType";

const ChatProductInfo = ({
  auctionId,
  auctionImageUrl,
  auctionTitle,
  currentPrice,
  sellingStatus,
}: ChatProductInfoProps) => {
  const [mode, setMode] = useState<string>("sell");
  const [payModalOpen, setPayModalOpen] = useState(false);

  const handlePaymentModalOpen = () => {
    setPayModalOpen(true);
  };

  return (
    <div
      key={auctionId}
      className="bg-light-purple flex justify-between gap-2 p-4"
    >
      <div className="bg-g300 size-15">
        <img className="w-100" src={auctionImageUrl ? auctionImageUrl : ""} />
      </div>
      <div className="flex w-[72%] flex-col gap-1 text-sm md:w-[60%]">
        <p className="text-xs">{sellingStatus}</p>
        <p className="font-bold">{auctionTitle}</p>
        <p className="text-g300">{currentPrice.toString()}</p>
      </div>
      <div className="flex w-[15%] flex-col gap-2">
        <button
          type="button"
          onClick={handlePaymentModalOpen}
          className="bg-purple w-full rounded-md px-2 py-1.5 text-xs text-white"
        >
          결제 요청
        </button>
        {mode === "sell" && (
          <>
            <button
              type="button"
              className="bg-purple w-full rounded-md px-2 py-1.5 text-xs text-white"
            >
              주소 입력
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatProductInfo;
