import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import { formatDate } from "../../../shared/utils/datetime";
import { StatusBadge } from "../../mypage/components/support/DetailCard";
import type {
  AdminInquiryAnswer,
  AdminInquiryPostProps,
} from "../types/AdminType";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";

const AdminInquiryPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inquiry, setInquiry] = useState<AdminInquiryPostProps | null>(null);

  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const getInquiry = async () => {
    try {
      const post = (await adminApi.get(`/admin/inquiries/${id}`)).data;
      setInquiry(post);
    } catch (error) {
      setInquiry(null);
      console.error("데이터 불러오기 실패:", error);
    }
  };

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

  useEffect(() => {
    if (!id) return;
    getInquiry();
  }, [id]);

  if (!inquiry) {
    return null;
  }

  return (
    <div className="text-[14px] leading-[1.5] text-neutral-900">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-neutral-400 hover:text-neutral-900"
      >
        ← 목록
      </button>

      <div className="border-b pb-4">
        <h3 className="text-[18px] font-bold text-neutral-900 sm:text-[20px] sm:leading-[1.4]">
          {inquiry.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500 sm:text-[13px]">
          <span className="flex items-center gap-1">
            <span className="text-neutral-400">분류</span>
            <span className="font-medium text-neutral-700">{inquiry.type}</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성자</span>
            <span className="font-medium text-neutral-700">
              {inquiry.userNickname}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성일시</span>
            <span className="font-medium text-neutral-700">
              {formatDate(inquiry.createdAt)}
            </span>
          </span>

          <StatusBadge status={inquiry.status} />
        </div>
      </div>

      {/* 내 문의(본문) */}
      <div className="mt-6 rounded-md border border-neutral-200 bg-white p-5">
        <div className="mb-2 text-[13px] font-semibold text-neutral-500">
          문의 내용
        </div>
        <p className="text-[14px] leading-7 whitespace-pre-line text-neutral-800">
          {inquiry.content}
        </p>
      </div>

      {/* 관리자 답변 */}
      {inquiry.requestContent ? (
        <div className="mt-6 flex flex-col gap-3 rounded-md border border-purple-200 bg-purple-50 p-5 sm:gap-4">
          <span className="inline-block w-20 rounded-md bg-purple-600 px-2 py-[2px] text-center text-[11px] font-medium text-white">
            답변
          </span>
          <h4 className="text-[14px] font-semibold text-neutral-900 sm:text-[15px]">
            {inquiry.requestTitle}
          </h4>
          <div className="text-[14px] leading-6 whitespace-pre-line text-neutral-700">
            {inquiry.requestContent}
          </div>
        </div>
      ) : (
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
      )}

      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};

export default AdminInquiryPost;
