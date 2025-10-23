import React from "react";
import { useRef, useEffect, useState } from "react";
import type { ModalProps } from "../../../shared/types/CommonType";
import type { NotiListProps } from "../types/NotiType";
import NotiList from "./NotiList";
import { X } from "lucide-react";

const notiList: NotiListProps[] = [
  {
    notification_id: BigInt(101),
    type: "alert",
    content:
      "일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림일반 알림",
    created_at: Date(),
    is_read: false,
    deleted_at: "x",
  },
  {
    notification_id: BigInt(102),
    type: "notice",
    content: "공지사항",
    created_at: Date(),
    is_read: false,
    deleted_at: "x",
  },
  {
    notification_id: BigInt(103),
    type: "warn",
    content: "경고",
    created_at: Date(),
    is_read: false,
    deleted_at: "x",
  },
  // ...
];
const NotiModal = ({ onClose, onDelete }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // list에 더미 데이터 표시: useChatApi로 이동할 것
  const [notis, setNotis] = useState<NotiListProps[]>(notiList);

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
    <div
      className="border-g500 fixed inset-0 z-51 h-full w-full rounded-md border-1 bg-white text-wrap shadow-lg md:absolute md:inset-auto md:top-[72px] md:right-4 md:h-150 md:w-100"
      ref={modalRef}
    >
      <div className="border-purple flex flex-shrink-0 items-center justify-between border-b p-4">
        <p className="font-bold">알림목록</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="text-g300 cursor-pointer text-xs"
          >
            전체삭제
          </button>
          <button onClick={onClose} aria-label="모달 닫기">
            <X />
          </button>
        </div>
      </div>
      <NotiList notis={notis} />
    </div>
  );
};

export default NotiModal;
