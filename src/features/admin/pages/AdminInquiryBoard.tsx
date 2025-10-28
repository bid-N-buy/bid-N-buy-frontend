import React from "react";
import AdminInquiryList from "../components/AdminInquiryList";
import { useInquiryList } from "../hooks/useAdminDashboard";

const AdmininquiryBoard = () => {
  const { inquiryList, pages } = useInquiryList();

  return (
    <div>
      <h3 className="mb-4 font-bold">문의/신고 현황</h3>
      <div></div>
      <AdminInquiryList inquiryList={inquiryList} />
      {pages && (
        <div className="mt-10 text-center">
          <span className="text-purple font-bold">{pages.currentPage + 1}</span>
          <span> / {pages.totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default AdmininquiryBoard;
