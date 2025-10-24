import { useRef, useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";
import { useAdminAuthStore } from "../store/adminStore";
import useToast from "../../../shared/hooks/useToast";
import type { ModalProps } from "../../../shared/types/CommonType";
import { X } from "lucide-react";

const AdminAlertPostModal = ({ onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const adminToken = useAdminAuthStore.getState().accessToken;
  const [content, setContent] = useState("");

  // 전송 완료/실패 알림
  const { showToast } = useToast();

  const sendAlert = async () => {
    if (!adminToken) {
      showToast("토큰이 없습니다.", "error");
      return;
    }
    try {
      await api.post(`/notifications`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        withCredentials: true,
      });
      showToast("알림이 발송되었습니다.", "success");
    } catch (error) {
      console.error("알림 발송 실패:", error);
      showToast("알림 발송에 실패했습니다.", "error");
      return;
    }
  };

  const submitAlert = (e: React.FormEvent) => {
    e.preventDefault(); // 폼 전송 방지
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
      className="border-g500 fixed inset-0 z-51 h-full w-full rounded-md border-1 bg-white text-wrap shadow-lg md:absolute md:inset-auto md:top-[72px] md:left-18 md:h-100 md:w-100"
      ref={modalRef}
    >
      <button onClick={onClose} aria-label="채팅 모달 닫기">
        <X />
      </button>
      <form onSubmit={submitAlert}>
        <label className="text-g100 w-full flex-shrink-0 text-base font-medium">
          알림 발송
        </label>
        <textarea
          name="alertContent"
          id="alertContent"
          placeholder="알림으로 보낼 내용을 작성해 주세요."
          className="h-full w-full focus:outline-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ resize: "none" }}
          required
        />
        <button type="submit">전송</button>
      </form>
    </div>
  );
};

export default AdminAlertPostModal;
