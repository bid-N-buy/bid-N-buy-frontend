import React, { useState, useEffect } from "react";
import AdminInquiryList from "../components/AdminInquiryList";
import { useInquiryList } from "../hooks/useAdminDashboard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AdmininquiryBoard = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const { inquiryList, pages, getInquiryList } = useInquiryList({ size: 10 });

  useEffect(() => {
    getInquiryList(currentPage, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePrevPage = () => {
    if (pages && !pages.first) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pages && !pages.last) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div>
      <h3 className="mb-4 font-bold">문의/신고 현황</h3>
      <div></div>
      <AdminInquiryList inquiryList={inquiryList} />
      {pages && pages.totalPages > 0 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={pages.first}
            className={`p-1 transition-colors ${
              pages.first
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-purple"
            }`}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-gray-700">
            <span className="text-purple font-semibold">
              {pages.currentPage + 1}
            </span>{" "}
            / {pages.totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pages.last}
            className={`p-1 transition-colors ${
              pages.last
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-purple"
            }`}
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdmininquiryBoard;
