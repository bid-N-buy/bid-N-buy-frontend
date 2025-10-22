// src/features/support/pages/InquiryDetailPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailCard from "../components/support/DetailCard";
import { useSupportDetail } from "../hooks/useInquiryReportDetail";

const InquiryDetailPage: React.FC = () => {
  // 통합 라우트: /mypage/support/:id
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { data, loading, errMsg } = useSupportDetail(id);

  if (loading) {
    return <div className="mx-auto w-full max-w-[840px] p-6">로딩중…</div>;
  }
  if (errMsg) {
    return (
      <div className="text-red mx-auto w-full max-w-[840px] p-6">{errMsg}</div>
    );
  }
  if (!data) return null;

  const category = data.isReport ? "신고" : "문의";

  const extra =
    data.isReport && (data.requestTitle || data.requestContent) ? (
      <div>
        <h5 className="text-h5 mb-3 font-semibold">추가 요청 정보</h5>
        {data.requestTitle && (
          <div className="mb-2">
            <div className="text-g300 mb-1 text-sm">요청 제목</div>
            <div className="font-medium">{data.requestTitle}</div>
          </div>
        )}
        {data.requestContent && (
          <div>
            <div className="text-g300 mb-1 text-sm">요청 내용</div>
            <div className="whitespace-pre-line">{data.requestContent}</div>
          </div>
        )}
      </div>
    ) : undefined;

  return (
    <div className="px-4 py-6">
      <DetailCard
        category={category}
        title={data.title}
        content={data.content}
        status={data.status}
        typeLabel={data.type}
        createdAt={data.createdAt}
        extra={extra}
        onBack={() => nav(-1)}
      />
    </div>
  );
};

export default InquiryDetailPage;
