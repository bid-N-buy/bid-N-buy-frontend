import { useRef, useEffect, useState } from "react";
import adminApi from "../api/adminAxiosInstance";
import { useAdminAuthStore } from "../store/adminStore";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import type { ModalProps } from "../../../shared/types/CommonType";
import { X } from "lucide-react";

const AdminAlertPostModal = ({ onClose }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const adminToken = useAdminAuthStore.getState().accessToken;
  const [form, setForm] = useState({ userId: "", content: "" });

  // 전송 완료/실패 알림
  const { toast, showToast, hideToast } = useToast();

  const sendAlert = async () => {
    if (!adminToken) {
      showToast("토큰이 없습니다.", "error");
      return;
    }
    const data = {
      userId: Number(form.userId.trim()) || null,
      content: form.content.trim(),
    };

    try {
      await adminApi.post(`/notifications`, data, {
        withCredentials: true,
      });
      showToast("알림이 발송되었습니다.", "success");
    } catch (error) {
      console.error("알림 발송 실패:", error);
      showToast("알림 발송에 실패했습니다.", "error");
      return;
    } finally {
      setForm({ userId: "", content: "" });
    }
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
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
    <>
      <div
        className="border-g500 fixed inset-0 z-51 h-full w-full rounded-md border-1 bg-white text-wrap shadow-lg md:absolute md:inset-auto md:top-[72px] md:left-18 md:h-100 md:w-100 md:rounded-md"
        ref={modalRef}
      >
        <div className="bg-deep-purple flex justify-between rounded-t-md p-3 text-white">
          <p className="font-bold">알림 발송</p>
          <button onClick={onClose} aria-label="채팅 모달 닫기" className="">
            <X />
          </button>
        </div>
        <form onSubmit={submitAlert} className="px-4 py-2">
          <label htmlFor="userId">보낼 회원</label>
          <input
            name="userId"
            id="userId"
            placeholder="특정 회원에게만 보낼 시에만 userId 입력"
            className="focus:outline-non2 my-2 h-full w-full rounded-md border border-gray-300 p-2"
            value={form.userId}
            onChange={onChange}
          />
          <label
            htmlFor="content"
            className="flex-shrink-0 text-base font-medium"
          >
            내용
          </label>
          <textarea
            name="content"
            id="content"
            placeholder="알림으로 보낼 내용을 작성해 주세요."
            className="my-2 h-full w-full rounded-md border border-gray-300 p-2 focus:outline-none"
            value={form.content}
            onChange={onChange}
            style={{ resize: "none" }}
            required
          />
          <button type="submit">전송</button>
        </form>
      </div>
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default AdminAlertPostModal;
