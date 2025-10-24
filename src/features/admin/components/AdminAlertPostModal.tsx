import { useRef, useEffect, useState } from "react";
import useToast from "../../../shared/hooks/useToast";
import type { ModalProps } from "../../../shared/types/CommonType";
import { X } from "lucide-react";

const AdminAlertPostModal = ({ onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState("");
  const [content, setContent] = useState("");

  // 전송 완료/실패 알림
  const { showToast } = useToast();

  const sendAlert = () => {};

  const submitAlert = (e) => {
    e.preventDefault(); // 폼 전송 방지
    showToast("알림이 발송되었습니다", "success");
    sendAlert();
  };

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
      className="border-g500 fixed inset-0 z-51 h-full w-full rounded-md border-1 bg-white text-wrap shadow-lg md:absolute md:inset-auto md:top-[72px] md:right-8 md:h-150 md:w-100"
      ref={modalRef}
    >
      <button onClick={onClose} aria-label="채팅 모달 닫기">
        <X />
      </button>
      <form onSubmit={submitAlert}>
        <button type="submit">전송</button>
      </form>
    </div>
  );
};

export default AdminAlertPostModal;
