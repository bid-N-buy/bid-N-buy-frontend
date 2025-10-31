import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailCard from "../components/support/DetailCard";
import { useReportDetail } from "../hooks/useReportDetail";

const ReportDetailPage: React.FC = () => {
  // 라우트: /mypage/support/reports/:id
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const { data, loading, errMsg } = useReportDetail(id);

  if (loading) {
    return <div className="mx-auto w-full max-w-[840px] p-6">로딩중…</div>;
  }
  if (errMsg) {
    return (
      <div className="mx-auto w-full max-w-[840px] p-6 text-red-600">
        {errMsg}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="px-4 py-6">
      <DetailCard
        category="신고"
        title={data.title}
        content={data.content}
        status={data.status}
        typeLabel={data.type}
        createdAt={data.createdAt}
        onBack={() => nav(-1)}
        requestTitle={data.requestTitle}
        requestContent={data.requestContent}
      />
    </div>
  );
};

export default ReportDetailPage;
