import React from "react";
import Avatar from "../../../shared/components/Avatar";
import type { ChatYouProps } from "../types/ChatType";
import { useAuthStore } from "../../auth/store/authStore";

const ChatYou = ({
  counterpartProfileImageUrl,
  counterpartNickname,
  messageType,
  message,
  createdAt,
  read,
  sellerId,
  auctionId,
  auctionImageUrl,
  auctionTitle,
  paymentId,
}: ChatYouProps) => {
  const userId = useAuthStore.getState().userId;

  return messageType === "CHAT" && sellerId === userId ? (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">
            {message + " ㅇㅇㅇㅇㅇ"}
          </p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">{createdAt}</p>
          </div>
        </div>
      </div>
    </div>
  ) : (
    // ) : messageType === "CHAT" && sellerId === userId ? (
    //   <div className="mx-2 my-4 flex gap-2">
    //     <Avatar imageUrl={counterpartProfileImageUrl} />
    //     <div key={paymentId}>
    //       <p className="mb-2 font-bold">{counterpartNickname}</p>
    //       <div className="flex items-end">
    //         <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">
    //           {message + " ::::내가파는사람"}
    //         </p>
    //         <div>
    //           <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
    //           <p className="text-g300 text-xs">{createdAt}</p>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // ) : messageType === "REQUEST" && sellerId !== userId ? (
    //   <div className="mx-2 my-4 flex gap-2">
    //     <Avatar imageUrl={counterpartProfileImageUrl} />
    //     <div key={paymentId}>
    //       <p className="mb-2 font-bold">{counterpartNickname}</p>
    //       <div className="flex items-end">
    //         <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
    //         <div>
    //           <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
    //           <p className="text-g300 text-xs">{createdAt}</p>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // ) : (
    <div className="mx-2 my-4 flex gap-2">
      <Avatar imageUrl={counterpartProfileImageUrl} />
      <div>
        <p className="mb-2 font-bold">{counterpartNickname}</p>
        <div className="flex items-end">
          <p className="bg-g400 mr-2 max-w-65 rounded-md p-3">{message}</p>
          <div>
            <p className="text-g300 text-xs">{read ? "읽음" : "전송됨"}</p>
            <p className="text-g300 text-xs">{createdAt}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatYou;
