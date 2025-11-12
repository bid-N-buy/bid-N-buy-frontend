import React, { useState, useMemo } from "react";
import type { FetchAuctionsParams } from "../../auction/api/auctions";
import AdminAuctionList from "../components/AdminAuctionList";
import { useAuctionList } from "../hooks/useAdminDashboard";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  params?: Omit<FetchAuctionsParams, "size" | "page">;
};

const AdminAuctionBoard = ({ params }: Props) => {
  const [currentPage, setCurrentPage] = useState(0);
  const auctionParams = useMemo(
    () => ({ ...params, size: 10, page: currentPage }),
    [params, currentPage]
  );
  const { auctions, pages } = useAuctionList({ params: auctionParams });

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
    <div className="w-full">
      <h2 className="mb-4 font-bold">거래글 관리</h2>
      <div></div>
      <AdminAuctionList auctions={auctions} />
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

export default AdminAuctionBoard;
