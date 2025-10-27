// src/features/support/pages/InquiryDetailPage.tsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailCard from "../components/support/DetailCard"; // 경로 주의!
import { useSupportDetail } from "../hooks/useInquiryReportDetail";

const InquiryDetailPage: React.FC = () => {
  // 라우트 예: /mypage/support/:id
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

  if (!data) {
    return null;
  }

  // 문의인지 신고인지 구분
  const category: "문의" | "신고" = data.isReport ? "신고" : "문의";

  // 신고일 때만 보여줄 추가 정보 섹션 (optional)
  // isReport === true 라면 extra 블럭이 의미 있고,
  // 문의 쪽은 답변은 DetailCard의 requestTitle/requestContent로 처리하니까 extra는 안 넘겨도 됨
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
        typeLabel={data.type} // e.g. "GENERAL"
        createdAt={data.createdAt}
        onBack={() => nav(-1)}
        // ✅ 답변 정보 전달 (있을 때만 DetailCard가 답변 박스 렌더)
        requestTitle={data.requestTitle}
        requestContent={data.requestContent}
        // ✅ 신고일 경우만 extra 블록 보여주고, 문의면 undefined라 그냥 안 나옴
        extra={extra}
      />
    </div>
  );
};

export default InquiryDetailPage;
