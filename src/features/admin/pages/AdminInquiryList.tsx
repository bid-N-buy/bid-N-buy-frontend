import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import adminApi from "../api/adminAxiosInstance";
import type {
  AdminManageInquiry,
  ManageInquiryProps,
} from "../types/AdminType";
import { formatDate } from "../../../shared/utils/datetime";

const AdmininquiryList = () => {
  const [inquiryList, setInquiryList] = useState<AdminManageInquiry[]>([]);
  const [pages, setPages] = useState<ManageInquiryProps>();
  const getInquiryList = async (page: number) => {
    try {
      const inquiries = (await adminApi.get(`/admin/inquiries?page=${page}`))
        .data;
      const pageInfo: ManageInquiryProps = inquiries;
      setInquiryList(inquiries.data);
      setPages(pageInfo);
    } catch (error) {
      setInquiryList([]);
      console.error("데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    getInquiryList(0);
  }, []);

  return (
    <div>
      <h2 className="mb-4 font-bold">문의/신고 현황</h2>
      <div></div>
      <table className="mb-10 w-full text-center">
        <colgroup>
          <col width={"5%"} />
          <col width={"15%"} />
          <col width={"45%"} />
          <col width={"15%"} />
          <col width={"10%"} />
          <col width={"10%"} />
        </colgroup>
        <thead className="border-deep-purple text-deep-purple bg-light-purple border-b">
          <tr>
            <th>No.</th>
            <th>문의 유형</th>
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
      {pages && (
        <div className="mt-10 text-center">
          <span className="text-purple font-bold">
            {pages?.currentPage + 1}
          </span>{" "}
          /{pages?.totalPages}
        </div>
      )}
    </div>
  );
};

export default AdmininquiryList;
