import React, { useState } from "react";
import { useParams } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import type { AdminInquiryAnswer } from "../types/AdminType";
import useToast from "../../../shared/hooks/useToast";

type Props = {
  onSuccess?: () => void;
};

const AdminInquiryAnswerForm = ({ onSuccess }: Props) => {
  const { id } = useParams();
  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "제목을 입력해 주세요.";
    if (form.title.trim().length > 50)
      return "제목은 최대 50자까지 입력 가능합니다.";
    if (!form.content.trim()) return "내용을 입력해 주세요.";
    if (form.content.trim().length > 1000)
      return "내용은 최대 1000자까지 입력 가능합니다.";
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
      showToast("답변이 등록되었습니다.", "success");

      setForm({ title: "", content: "" });

      // 부모 컴포넌트에 성공 알림 (데이터 재로딩용)
      if (onSuccess) {
        onSuccess();
      } else {
        // onSuccess 없으면 페이지 새로고침
        window.location.reload();
      }
    } catch (e) {
      console.error("답변 처리 중 오류 발생:", e);
      showToast("답변 처리 중 오류가 발생했습니다.", "error");
      return;
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
            답변 제목 <span className="text-purple">*</span>
          </span>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="제목을 입력하세요"
            maxLength={50}
            className="focus:border-purple w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[14px] text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none"
            disabled={loading}
          />
          <div className="mt-1 text-right text-[12px] text-neutral-400">
            {form.title.length}/50
          </div>
        </label>

        {/* 내용 */}
        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-neutral-800">
            답변 내용 <span className="text-purple">*</span>
          </span>
          <textarea
            name="content"
            value={form.content}
            onChange={onChange}
            placeholder={"답변을 입력하세요"}
            rows={8}
            maxLength={1000}
            className="focus:border-purple w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-[14px] leading-6 text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none"
            disabled={loading}
          />
          <div className="mt-1 text-right text-[12px] text-neutral-400">
            {form.content.length}/1000
          </div>
        </label>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setForm({ title: "", content: "" })}
            className="cursor-pointer rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-60"
            disabled={loading}
          >
            초기화
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
          >
            {loading ? "전송 중..." : "답변 등록"}
          </button>
        </div>
      </form>
    </>
  );
};

export default AdminInquiryAnswerForm;
