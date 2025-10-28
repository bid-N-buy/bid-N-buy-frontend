import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../../../shared/utils/datetime";
import type { AdminUserListProps } from "../types/AdminType";

const AdminUserList = ({ userList }: AdminUserListProps) => {
  return (
    <table className="w-full text-center">
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
  );
};

export default AdminUserList;
