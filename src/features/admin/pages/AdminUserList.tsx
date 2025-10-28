import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import type { AdminManageUser, ManageUserProps } from "../types/AdminType";
import { formatDate } from "../../../shared/utils/datetime";

const AdminUserList = () => {
  const [userList, setUserList] = useState<AdminManageUser[]>([]);
  const [pages, setPages] = useState<ManageUserProps>();
  const getUserList = async (page: number) => {
    try {
      const users = (await adminApi.get(`/admin/users?page=${page}`)).data;
      const pageInfo: ManageUserProps = users;
      setUserList(users.data);
      setPages(pageInfo);
    } catch (error) {
      setUserList([]);
      console.error("데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    getUserList(0);
  }, []);

  return (
    <div>
      <h2 className="mb-4 font-bold">회원 관리</h2>
      <div></div>
      <table className="mb-10 w-full text-center">
        <colgroup>
          <col width={"5%"} />
          <col width={"45%"} />
          <col width={"15%"} />
          <col width={"15%"} />
          <col width={"10%"} />
          <col width={"10%"} />
        </colgroup>
        <thead className="border-deep-purple text-deep-purple bg-light-purple border-b">
          <tr>
            <th>No.</th>
            <th>아이디(이메일)</th>
            <th>닉네임</th>
            <th>가입일시</th>
            <th>패널티</th>
            <th>활동상태</th>
          </tr>
        </thead>
        <tbody>
          {userList.map((item, i) => (
            <tr key={item.userId} className="border-b border-gray-300">
              <td>{i + 1}</td>
              <td>
                <Link to={`/admin/users/${item.userId}`}>{item.email}</Link>
              </td>
              <td>{item.nickname}</td>
              <td>{formatDate(item.createdAt)}</td>
              <td>{item.penaltyPoints}</td>
              <td>{item.activityStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pages && (
        <div className="mt-10 text-center">
          <span className="text-purple font-bold">{pages.currentPage + 1}</span>
          <span> / {pages.totalPages}</span>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;
