import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import AdminAuctionList from "../components/AdminAuctionList";
import AdmininquiryList from "../components/AdminInquiryList";
import AdminUserList from "../components/AdminUserList";
import {
  useInquiryList,
  useUserList,
  useAuctionList,
} from "../hooks/useAdminDashboard";

const AdminDashboard = () => {
  const { inquiryList, getInquiryList } = useInquiryList({ size: 10 });
  const { userList, getUserList } = useUserList({ size: 10 });
  const auctionParams = useMemo(() => ({ size: 10 }), []);
  const { auctions } = useAuctionList({ params: auctionParams });

  useEffect(() => {
    getInquiryList(0, 10);
    getUserList(0, 10);
    // useAuctionList는 내부 useEffect에서 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/"
          className="group relative inline-block font-logo text-h3 md:text-h2 lg:text-h1"
        >
          Bid<span className="text-purple">&amp;</span>Buy
          <span className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white whitespace-nowrap group-hover:visible">
            서비스 메인 이동
          </span>
        </Link>
      </div>
      <div className="flex flex-col gap-10">
        <div className="rounded-lg border border-gray-300 p-6">
          <Link
            to="/admin/inquiries"
            className="mb-4 block font-bold text-gray-900 cursor-pointer hover:text-purple transition-colors"
          >
            문의/신고 현황
          </Link>
          <AdmininquiryList inquiryList={inquiryList} />
        </div>
        <div className="rounded-lg border border-gray-300 p-6">
          <Link
            to="/admin/users"
            className="mb-4 block font-bold text-gray-900 cursor-pointer hover:text-purple transition-colors"
          >
            회원 관리
          </Link>
          <AdminUserList userList={userList} />
        </div>
        <div className="rounded-lg border border-gray-300 p-6">
          <Link
            to="/admin/auctions"
            className="mb-4 block font-bold text-gray-900 cursor-pointer hover:text-purple transition-colors"
          >
            거래글 관리
          </Link>
          <AdminAuctionList auctions={auctions} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
