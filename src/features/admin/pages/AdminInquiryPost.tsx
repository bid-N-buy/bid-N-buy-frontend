import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import { formatDate } from "../../../shared/utils/datetime";
import { StatusBadge } from "../../mypage/components/support/DetailCard";
import type { AdminInquiryPostProps } from "../types/AdminType";
import AdminInquiryAnswerForm from "../components/AdminInquiryAnswerForm";

const AdminInquiryPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inquiry, setInquiry] = useState<AdminInquiryPostProps | null>(null);

  const getInquiry = async () => {
    try {
      const post = (await adminApi.get(`/admin/inquiries/${id}`)).data;
      setInquiry(post);
    } catch (error) {
      setInquiry(null);
      console.error("데이터 불러오기 실패:", error);
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
        <AdminInquiryAnswerForm />
      )}
    </div>
  );
};

export default AdminInquiryPost;
