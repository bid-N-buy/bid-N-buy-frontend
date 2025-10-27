import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../shared/api/axiosInstance";
import type { AuctionItem } from "../../auction/types/auctions";
import type { AdminManageAuction } from "../types/AdminType";
import { formatDate } from "../../../shared/utils/datetime";

const AdminAuctionList = () => {
  const [board, setBoard] = useState<AuctionItem[]>([]);
  const [page, setPagination] = useState();
  const getBoardList = async () => {
    try {
      const auctions = (await api.get("/auctions")).data as AdminManageAuction;
      setBoard(auctions.data);
    } catch (error) {
      setBoard([]);
      console.error("데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    getBoardList();
  }, []);

  return (
    <div className="w-full p-10">
      <h2 className="mb-4 font-bold">거래글 관리</h2>
      <div></div>
      <table className="w-full text-center">
        <colgroup>
          <col width={"5%"} />
          <col width={"10%"} />
          <col width={"55%"} />
          <col width={"15%"} />
          <col width={"15%"} />
        </colgroup>
        <thead className="border-deep-purple text-deep-purple bg-light-purple border-b">
          <tr>
            <th>No.</th>
            <th>대표 이미지</th>
            <th>제목</th>
            <th>등록일시</th>
            <th>진행 상태</th>
          </tr>
        </thead>
        <tbody>
          {board.map((item, i) => (
            <tr key={item.auctionId} className="border-b border-gray-300">
              <td>{i + 1}</td>
              <td>
                <img
                  src={item.mainImageUrl || ""}
                  className="size-full"
                  alt={item.title}
                />
              </td>
              <td className="text-left">
                <Link to={`/admin/auctions/${item.auctionId}`}>
                  {item.title}
                </Link>
              </td>
              <td>{formatDate(item.createdAt)}</td>
              <td>{item.sellingStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* <div>{currentPage}</div> */}
    </div>
  );
};

export default AdminAuctionList;
