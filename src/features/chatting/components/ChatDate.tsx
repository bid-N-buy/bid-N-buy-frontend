import React from "react";
import type { ChatDateProps } from "../types/ChatType";

const ChatDate = ({ date }: ChatDateProps) => {
  // 날짜 포맷팅 로직 (예: "2025년 11월 12일") 추가
  const formattedDate = new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div className="text-g300 my-4 text-center text-sm">{formattedDate}</div>
  );
};

export default ChatDate;
