import React, { useEffect } from "react";
import AdminAuctionList from "../components/AdminAuctionList";
import AdmininquiryList from "../components/AdminInquiryList";
import AdminUserList from "../components/AdminUserList";
import {
  useInquiryList,
  useUserList,
  useAuctionList,
} from "../hooks/useAdminDashboard";

const AdminDashboard = () => {
  const { inquiryList, getInquiryList } = useInquiryList();
  const { userList, getUserList } = useUserList();
  const { auctions, getAuctionsList } = useAuctionList({});

  useEffect(() => {
    try {
      getInquiryList(0);
      getUserList(0);
      getAuctionsList();
    } catch (error) {
      console.error("정보를 불러오는 데에 오류 발생:", error);
    }
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <div className="rounded-lg border border-gray-300 p-6">
        <h3 className="mb-4 font-bold">문의/신고 현황</h3>
        <AdmininquiryList inquiryList={inquiryList} />
      </div>
      <div className="rounded-lg border border-gray-300 p-6">
        <h3 className="mb-4 font-bold">회원 목록</h3>
        <AdminUserList userList={userList} />
      </div>
      <div className="rounded-lg border border-gray-300 p-6">
        <h3 className="mb-4 font-bold">거래글 목록</h3>
        <AdminAuctionList auctions={auctions} />
      </div>
    </div>
  );
};

export default AdminDashboard;
