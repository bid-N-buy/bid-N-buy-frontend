import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AuctionItem, AuctionsRes } from "../../auction/types/auctions";
import { formatDate } from "../../../shared/utils/datetime";
import {
  fetchAuctions,
  type FetchAuctionsParams,
} from "../../auction/api/auctions";

type Props = {
  params?: Omit<FetchAuctionsParams, "size" | "page">;
};

const AdminAuctionList = ({ params }: Props) => {
  // const [searchParams, setSearchParams] = useSearchParams();
  // const urlPage = Number(searchParams.get("page")) || 1;
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [pages, setPages] = useState<AuctionsRes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getAuctionsList = async () => {
      try {
        setLoading(true);
        setError(null);
        const query: FetchAuctionsParams = {
          sortBy: "latest",
          includeEnded: true,
          page: 0,
          size: 20,
          ...(params ?? {}),
        };
        const data: AuctionsRes = await fetchAuctions(query);
        const list =
          (data as any).data ??
          (data as any).items ??
          (data as any).content ??
          [];
        setAuctions(list as AuctionItem[]);
        setPages(data);
      } catch (error) {
        console.error("데이터 불러오기 실패:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    getAuctionsList();
  }, [params]);

  // 페이지 변경
  const handlePageChange = (page: number) => {
    if (page <= 1) {
      searchParams.delete("page");
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ page: page.toString() }, { replace: true });
    }
  };

  if (loading) return <p className="text-sm text-neutral-500">불러오는 중…</p>;

  return (
    <div className="w-full">
      <h2 className="mb-4 font-bold">거래글 관리</h2>
      <div></div>
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
            <th>No.</th>
            <th>대표 이미지</th>
            <th>제목</th>
            <th>등록일시</th>
            <th>진행 상태</th>
          </tr>
        </thead>
        <tbody>
          {auctions.map((item, i) => (
            <tr key={item.auctionId} className="border-b border-gray-300">
              <td>{i + 1}</td>
              <td className="flex justify-center">
                <img
                  src={item.mainImageUrl || ""}
                  className="size-10"
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

export default AdminAuctionList;
