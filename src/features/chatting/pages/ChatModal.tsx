import React from "react";
import { useRef, useEffect } from "react";
import type { ChatModalProps } from "../types/ChatType";
// import Chat from "../components/Chat";
import { X } from "lucide-react";
import ChatList from "./ChatList";

const ChatModal = ({ onClose }: ChatModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [modalRef, onClose]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} ref={modalRef}>
      <div className="absolute inset-0 z-51 h-full w-full rounded-md bg-white shadow-md md:top-[50%] md:left-[50%] md:h-150 md:w-100 md:translate-[-50%]">
        <div className="border-purple flex flex-shrink-0 items-center justify-between border-b p-4">
          <p className="font-bold">채팅목록</p>
          <button onClick={onClose} aria-label="모달 닫기">
            <X />
          </button>
        </div>
        <div className="h-[calc(100%-59px)] overflow-y-auto">
          <ChatList />
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
