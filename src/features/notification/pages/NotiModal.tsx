import React from "react";
import { useRef, useEffect } from "react";
import type { ModalProps } from "../../chatting/types/ChatType";
import NotiList from "./NotiList";
import { X } from "lucide-react";

const NotiModal = ({ onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // modal창 닫기: 여백 누를 시 꺼지도록
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
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 z-51 h-full w-full rounded-md bg-white shadow-md md:top-[50%] md:left-[50%] md:h-150 md:w-100 md:translate-[-50%]"
        ref={modalRef}
      >
        <div className="border-purple flex flex-shrink-0 items-center justify-between border-b p-4">
          <p className="font-bold">알림목록</p>
          <button onClick={onClose} aria-label="모달 닫기">
            <X />
          </button>
        </div>
        <NotiList />
      </div>
    </div>
  );
};

export default NotiModal;
