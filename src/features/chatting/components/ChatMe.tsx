import React from "react";
import { useAuthStore } from "../../auth/store/authStore";
import type { ChatMeProps } from "../types/ChatType";

const ChatMe = ({
  message,
  createdAt,
  messageType,
  read,
  sellerId,
  auctionId,
  auctionImageUrl,
  auctionTitle,
  paymentId,
}: ChatMeProps) => {
  const userId = useAuthStore.getState().userId;

  return messageType === "CHAT" ? (
    <div className="m-2 flex items-end justify-end gap-2 text-right">
      <div>
        <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
        <p className="text-g300 text-xs">{createdAt}</p>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    </div>
  ) : (
    // ) : messageType === "REQUEST" && sellerId === userId ? (
    //   <div className="m-2 flex items-end justify-end gap-2 text-right">
    //     <div key={paymentId}>
    //       <p className="text-g300 text-xs">{read ? "" : "전송됨"}</p>
    //       <p className="text-g300 text-xs">{createdAt}</p>
    //     </div>
    //     <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    //   </div>
    // ) : messageType === "REQUEST" && sellerId !== userId ? (
    //   <div className="m-2 flex items-end justify-end gap-2 text-right">
    //     <div key={paymentId}>
    //       <p className="text-g300 text-xs">{read ? "" : "전송됨"}</p>
    //       <p className="text-g300 text-xs">{createdAt}</p>
    //     </div>
    //     <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    //   </div>
    // )
    <div className="m-2 flex items-end justify-end gap-2 text-right">
      <div>
        <p className="text-g300 text-xs">{read ? "" : "전송됨"}</p>
        <p className="text-g300 text-xs">{createdAt}</p>
      </div>
      <div className="bg-light-purple max-w-80 rounded-md p-3">{message}</div>
    </div>
  );
};

export default ChatMe;
