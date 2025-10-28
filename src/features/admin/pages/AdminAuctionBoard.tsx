import React from "react";
import type { FetchAuctionsParams } from "../../auction/api/auctions";
import AdminAuctionList from "../components/AdminAuctionList";
import { useAuctionList } from "../hooks/useAdminDashboard";

type Props = {
  params?: Omit<FetchAuctionsParams, "size" | "page">;
};

const AdminAuctionBoard = ({ params }: Props) => {
  // const [searchParams, setSearchParams] = useSearchParams();
  // const urlPage = Number(searchParams.get("page")) || 1;
  const { auctions, pages } = useAuctionList({ params });

  // 페이지 변경
  const handlePageChange = (page: number) => {
    if (page <= 1) {
      searchParams.delete("page");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ page: page.toString() }, { replace: true });
    }
  };

  return (
    <div className="w-full">
      <h2 className="mb-4 font-bold">거래글 관리</h2>
      <div></div>
      <AdminAuctionList auctions={auctions} />
      {pages && (
        <div className="mt-10 text-center">
          <span className="text-purple font-bold">{pages.currentPage + 1}</span>
          <span> / {pages.totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionBoard;
