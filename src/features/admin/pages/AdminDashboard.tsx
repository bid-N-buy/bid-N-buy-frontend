import React, { useEffect, useMemo } from "react";
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
    <div className="h-screen overflow-y-auto">
      <div className="flex flex-col gap-10">
        <div className="rounded-lg border border-gray-300 p-6">
          <h3 className="mb-4 font-bold text-gray-900">문의/신고 현황</h3>
          <AdmininquiryList inquiryList={inquiryList} />
        </div>
        <div className="rounded-lg border border-gray-300 p-6">
          <h3 className="mb-4 font-bold text-gray-900">회원 목록</h3>
          <AdminUserList userList={userList} />
        </div>
        <div className="rounded-lg border border-gray-300 p-6">
          <h3 className="mb-4 font-bold text-gray-900">거래글 목록</h3>
          <AdminAuctionList auctions={auctions} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
