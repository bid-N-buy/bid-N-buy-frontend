import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../../../shared/utils/datetime";
import type { AdminAuctionListProps } from "../types/AdminType";

const AdminAuctionList = ({ auctions }: AdminAuctionListProps) => {
  return (
    <table className="w-full text-center">
      <colgroup>
        <col width={"3%"} />
        <col width={"15%"} />
        <col width={"50%"} />
        <col width={"15%"} />
        <col width={"15%"} />
      </colgroup>
      <thead className="border-deep-purple text-deep-purple bg-light-purple border-b">
        <tr>
          <th>id</th>
          <th>대표 이미지</th>
          <th>제목</th>
          <th>등록일시</th>
          <th>진행 상태</th>
        </tr>
      </thead>
      <tbody>
        {auctions.map((item) => (
          <tr key={item.auctionId} className="border-b border-gray-300">
            <td>{item.auctionId}</td>
            <td className="flex justify-center">
              <img
                src={item.mainImageUrl || ""}
                className="size-10"
                alt={item.title}
              />
            </td>
            <td className="text-left">
              <Link to={`/admin/auctions/${item.auctionId}`}>{item.title}</Link>
            </td>
            <td>{formatDate(item.createdAt)}</td>
            <td>{item.sellingStatus}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminAuctionList;
