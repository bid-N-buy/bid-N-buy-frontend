import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import adminApi from "../api/adminAxiosInstance";
import { formatDate } from "../../../shared/utils/datetime";
import InquiryStatusBadge from "../components/InquiryStatusBadge";
import type { AdminInquiryPostProps } from "../types/AdminType";
import AdminInquiryAnswerForm from "../components/AdminInquiryAnswerForm";

const AdminInquiryPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inquiry, setInquiry] = useState<AdminInquiryPostProps | null>(null);

  const getInquiry = useCallback(async () => {
    if (!id) return;
    try {
      const post = (await adminApi.get(`/admin/inquiries/${id}`)).data;
      setInquiry(post);
    } catch (error) {
      setInquiry(null);
      return;
    }
  }, [id]);

  useEffect(() => {
    getInquiry();
  }, [getInquiry]);

  if (!inquiry) {
    return null;
  }

  return (
    <div className="text-[14px] leading-[1.5] text-neutral-900">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-purple"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>목록</span>
      </button>

      <div className="border-b pb-4">
        <h3 className="text-[18px] font-bold text-neutral-900 sm:text-[20px] sm:leading-[1.4]">
          {inquiry.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500 sm:text-[13px]">
          <span className="flex items-center gap-1">
            <span className="text-neutral-400">유형</span>
            <span className="font-medium text-neutral-700">
              {inquiry.type === "REPORT" ? "신고" : "문의"}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">아이디(이메일)</span>
            <Link
              to={`/admin/users/${inquiry.userId}`}
              className="text-neutral-700 hover:text-purple transition-colors"
            >
              {inquiry.userEmail}
            </Link>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성일시</span>
            <span className="font-medium text-neutral-700">
              {formatDate(inquiry.createdAt)}
            </span>
          </span>

          <InquiryStatusBadge status={inquiry.status} />
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
        <div className="border-purple bg-light-purple mt-6 flex flex-col gap-3 rounded-md border p-5 sm:gap-4">
          <span className="bg-purple inline-block w-20 rounded-md px-2 py-[2px] text-center text-[11px] font-medium text-white">
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
        <AdminInquiryAnswerForm onSuccess={getInquiry} />
      )}
    </div>
  );
};

export default AdminInquiryPost;
