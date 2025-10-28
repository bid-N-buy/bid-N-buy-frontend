import React from "react";
import { useUserList } from "../hooks/useAdminDashboard";
import AdminUserList from "../components/AdminUserList";

const AdminUserBoard = () => {
  const { userList, pages } = useUserList();

  return (
    <div>
      <h2 className="mb-4 font-bold">회원 관리</h2>
      <div></div>
      <AdminUserList userList={userList} />
      {pages && (
        <div className="mt-10 text-center">
          <span className="text-purple font-bold">{pages.currentPage + 1}</span>
          <span> / {pages.totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default AdminUserBoard;
