import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../../../shared/utils/datetime";
import { StatusBadge } from "../../mypage/components/support/DetailCard";
import type { AdminInquiryListProps } from "../types/AdminType";

const AdminInquiryList = ({ inquiryList }: AdminInquiryListProps) => {
  return (
    <table className="w-full text-center">
      <colgroup>
        <col width={"5%"} />
        <col width={"10%"} />
        <col width={"45%"} />
        <col width={"15%"} />
        <col width={"15%"} />
        <col width={"10%"} />
      </colgroup>
      <thead className="border-deep-purple text-deep-purple bg-light-purple border-b">
        <tr>
          <th>No.</th>
          <th>유형</th>
          <th>제목</th>
          <th>닉네임</th>
          <th>작성일시</th>
          <th>답변상태</th>
        </tr>
      </thead>
      <tbody>
        {inquiryList.map((item, i) => (
          <tr key={item.inquiriesId} className="border-b border-gray-300">
            <td>{i + 1}</td>
            <td>{item.type === "REPORT" ? "신고" : "문의"}</td>
            <td className="text-left">
              <Link to={`/admin/inquiries/${item.inquiriesId}`}>
                {item.title}
              </Link>
            </td>
            <td>{item.userNickname}</td>
            <td>{formatDate(item.createdAt)}</td>
            <td>
              <StatusBadge status={item.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminInquiryList;
