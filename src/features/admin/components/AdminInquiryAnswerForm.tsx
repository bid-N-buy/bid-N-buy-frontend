import React, { useState } from "react";
import { useParams } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import type { AdminInquiryAnswer } from "../types/AdminType";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";

const AdminInquiryAnswerForm = () => {
  const { id } = useParams();
  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "제목을 입력해 주세요.";
    if (!form.content.trim()) return "내용을 입력해 주세요.";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) return showToast(v, "error");

    try {
      setLoading(true);
      const headers = {
        "Content-Type": "application/json",
        withCredentials: true,
      };
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
      };
      await adminApi.post<AdminInquiryAnswer>(
        `/admin/inquiries/${id}/reply`,
        payload,
        { headers }
      );
      showToast("문의가 등록되었습니다.", "success");

      setForm({ title: "", content: "" });
    } catch (error) {
      console.error("답변 처리 중 오류 발생:", error);
      showToast("답변 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="mt-10 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
      >
        {/* 제목 */}
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-neutral-800">
            답변 제목 <span className="text-purple-600">*</span>
          </span>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="제목을 입력하세요"
            maxLength={100}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            disabled={loading}
          />
          <div className="mt-1 text-right text-[12px] text-neutral-400">
            {form.title.length}/100
          </div>
        </label>

        {/* 내용 */}
        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-neutral-800">
            답변 내용 <span className="text-purple-600">*</span>
          </span>
          <textarea
            name="content"
            value={form.content}
            onChange={onChange}
            placeholder={"답변을 입력하세요"}
            rows={8}
            className="w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2 text-[14px] leading-6 text-neutral-900 placeholder:text-neutral-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            disabled={loading}
          />
          <div className="mt-1 text-right text-[12px] text-neutral-400">
            최소 10자 이상 입력해 주세요.
          </div>
        </label>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setForm({ title: "", content: "" })}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
            disabled={loading}
          >
            초기화
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-300 focus:outline-none disabled:opacity-60"
          >
            {loading ? "전송 중..." : "답변 등록"}
          </button>
        </div>
      </form>
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default AdminInquiryAnswerForm;
