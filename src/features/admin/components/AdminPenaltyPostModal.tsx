import { useRef, useEffect, useState } from "react";
import adminApi from "../api/adminAxiosInstance";
import { useAdminAuthStore } from "../store/adminStore";
import useToast from "../../../shared/hooks/useToast";
import type { AdminPenaltyPostProps } from "../types/AdminType";
import { X, ChevronDown } from "lucide-react";

const AdminPenaltyPostModal = ({
  userId,
  userEmail,
  onClose,
}: AdminPenaltyPostProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const adminToken = useAdminAuthStore.getState().accessToken;
  const [form, setForm] = useState({ userId: userId, type: "LEVEL_1" });

  // 전송 완료/실패 시 토스트
  const { showToast } = useToast();

  const sendPenalty = async () => {
    if (!adminToken) {
      showToast("토큰이 없습니다.", "error");
      return;
    }
    const data = {
      userId: form.userId,
      type: form.type,
    };

    try {
      await adminApi.post(`/admin/penalty`, data, {
        withCredentials: true,
      });
      showToast("페널티 부과 완료", "success");
    } catch (e) {
      console.error("페널티 부과 실패:", e);
      showToast("페널티 부과 실패", "error");
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

  // modal창 닫기 - 여백 누를 시 꺼지도록
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
        <div className="bg-deep-purple flex items-center justify-between rounded-t-md p-3 text-white">
          <p className="font-bold">페널티 부과</p>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="flex cursor-pointer items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={submitPenalty}
          className="mt-2 mb-4 flex flex-col gap-3 px-4 py-2"
        >
          <label className="flex items-center gap-4" htmlFor="userId">
            <span className="flex-shrink-0 text-sm font-medium">부과 대상</span>
            <input
              id="userId"
              name="userId"
              className="flex-1 px-1.5 font-bold focus:cursor-default focus:outline-none"
              value={userEmail || userId}
              readOnly
            />
          </label>
          <label htmlFor="type" className="flex items-center gap-4">
            <span className="flex-shrink-0 text-sm font-medium">부과 점수</span>
            <div className="relative flex-1">
              <select
                name="type"
                id="type"
                className="focus:border-purple h-full w-full appearance-none rounded-md border border-gray-300 p-2 pr-8 focus:outline-none"
                value={form.type}
                onChange={onChange}
                required
              >
                <option value="LEVEL_1">LEVEL_1</option>
                <option value="LEVEL_2">LEVEL_2</option>
                <option value="LEVEL_3">LEVEL_3</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            </div>
          </label>
          <button
            className="border-purple text-purple hover:bg-light-purple mt-1 w-full cursor-pointer rounded-md border py-2 font-bold transition-colors"
            type="submit"
          >
            전송
          </button>
        </form>
      </div>
    </>
  );
};

export default AdminPenaltyPostModal;
