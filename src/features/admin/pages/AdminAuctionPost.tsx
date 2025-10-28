import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuctionDetailStore } from "../../auction/store/auctionDetailStore";
import { formatDate } from "../../../shared/utils/datetime";
import ProductImage from "../../auction/components/ProductImage";

const AdminAuctionPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    detail: auction,
    loading,
    error,
    load,
    reset,
  } = useAuctionDetailStore();

  useEffect(() => {
    if (!id) return;
    reset();
    load(Number(id));
  }, [id, reset, load]);

  if (loading) return <div className="text-g300 p-6">로딩 중...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!auction) return <div className="p-6">데이터가 없습니다.</div>;

  return (
    <div className="text-[14px] leading-[1.5] text-neutral-900">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-neutral-400 hover:text-neutral-900"
      >
        ← 목록
      </button>

      {/* 제목 + 메타 */}
      <div className="border-b pb-4">
        <h3 className="text-[18px] font-bold text-neutral-900 sm:text-[20px] sm:leading-[1.4]">
          {auction.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500 sm:text-[13px]">
          <span className="flex items-center gap-1">
            <span className="text-neutral-400">카테고리</span>
            <span className="font-medium text-neutral-700">
              {auction.categoryMain} &gt; {auction.categorySub}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성자</span>
            <span className="font-medium text-neutral-700">
              {auction.sellerNickname}
            </span>
          </span>

          <span className="flex items-center gap-1">
            <span className="text-neutral-400">작성일시</span>
            <span className="font-medium text-neutral-700">
              {formatDate(auction.createdAt)}
            </span>
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="mt-6 grid grid-cols-2 grid-cols-[1fr_2fr] gap-4 rounded-md border border-neutral-200 bg-white p-5">
        <ProductImage images={auction.images} />
        <p className="text-[14px] leading-7 whitespace-pre-line text-neutral-800">
          {auction.description}
        </p>
      </div>
    </div>
  );
};

export default AdminAuctionPost;
