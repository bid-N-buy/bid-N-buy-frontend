import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import type { AdminManageInquiry } from "../types/AdminType";
import { formatDate } from "../../../shared/utils/datetime";

const AdmininquiryList = () => {
  const [inquiryList, setinquiryList] = useState<AdminManageInquiry[]>([]);
  const getinquiryList = async () => {
    try {
      const inquiries = (await adminApi.get("/admin/inquiries")).data.content;
      console.log(inquiries);
      setinquiryList(inquiries);
    } catch (error) {
      setinquiryList([]);
      console.error("데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    getinquiryList();
  }, []);

  return (
    <div className="w-full p-10">
      <h2 className="mb-4 font-bold">회원 관리</h2>
      <div></div>
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
            <th>문의 유형</th>
            <th>아이디(이메일)</th>
            <th>닉네임</th>
            <th>작성일시</th>
            <th>답변상태</th>
          </tr>
        </thead>
        <tbody>
          {inquiryList.map((item, i) => (
            <tr key={item.inquiriesId} className="border-b border-gray-300">
              <td>{i + 1}</td>
              <td>{item.type}</td>
              <td className="text-left">
                <Link to={`/admin/inquiries/${item.inquiriesId}`}>
                  {item.title}
                </Link>
              </td>
              <td>{item.userNickname}</td>
              <td>{formatDate(item.createdAt)}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdmininquiryList;
