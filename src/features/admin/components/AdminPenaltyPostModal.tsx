import { useRef, useEffect, useState } from "react";
import adminApi from "../api/adminAxiosInstance";
import { useAdminAuthStore } from "../store/adminStore";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import type { AdminPenaltyPostProps } from "../types/AdminType";
import { X } from "lucide-react";

const AdminPenaltyPostModal = ({ userId, onClose }: AdminPenaltyPostProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const adminToken = useAdminAuthStore.getState().accessToken;
  const [form, setForm] = useState({ userId: userId, type: "LEVEL_1" });

  // 전송 완료/실패 알림
  const { toast, showToast, hideToast } = useToast();

  const sendPenalty = async () => {
    if (!adminToken) {
      showToast("토큰이 없습니다.", "error");
      return;
    }
    const data = {
      userId: form.userId,
      type: form.type,
    };
    console.log(data);

    try {
      await adminApi.post(`/admin/penalty`, data, {
        withCredentials: true,
      });
      showToast("패널티 추가되었습니다.", "success");
    } catch (error) {
      console.error("패널티 추가 실패:", error);
      showToast("패널티 추가에 실패했습니다.", "error");
      return;
    } finally {
      setForm({ userId: userId, type: "LEVEL_1" });
    }
  };

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submitPenalty = (e: React.FormEvent) => {
    e.preventDefault(); // 폼 전송 방지
    sendPenalty();
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
        className="border-g500 fixed inset-0 z-51 h-full w-full border-1 bg-white text-wrap shadow-lg md:absolute md:inset-auto md:top-[50%] md:left-[50%] md:h-auto md:w-100 md:-translate-[50%] md:rounded-md"
        ref={modalRef}
      >
        <div className="bg-deep-purple flex justify-between rounded-t-md p-3 text-white">
          <p className="font-bold">패널티 부과</p>
          <button onClick={onClose} aria-label="모달 닫기" className="">
            <X />
          </button>
        </div>
        <form
          onSubmit={submitPenalty}
          className="mt-2 mb-4 flex flex-col gap-1 px-4 py-2"
        >
          <label className="flex gap-2" htmlFor="userId">
            부과 대상
            <input
              id="userId"
              name="userId"
              className="w-auto font-bold focus:cursor-default focus:outline-none"
              value={form.userId}
              readOnly
            />
          </label>
          <label htmlFor="type" className="flex items-center gap-2">
            부과 점수
            <select
              name="type"
              id="type"
              className="my-2 h-full w-76.5 rounded-md border border-gray-300 p-2 focus:outline-none"
              value={form.type}
              onChange={onChange}
              required
            >
              <option value="LEVEL_1">LEVEL_1</option>
              <option value="LEVEL_2">LEVEL_2</option>
              <option value="LEVEL_3">LEVEL_3</option>
            </select>
          </label>
          <button
            className="border-purple text-purple mt-1 w-full rounded-md border py-2"
            type="submit"
          >
            전송
          </button>
        </form>
      </div>
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default AdminPenaltyPostModal;
