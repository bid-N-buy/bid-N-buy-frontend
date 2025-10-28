import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuctionDetailStore } from "../../auction/store/auctionDetailStore";
import { formatTime } from "../../../shared/utils/datetime";

const AdminAuctionPost = () => {
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h4 className="font-bold">{auction.title}</h4>
        <h5>
          {auction.categoryMain} &gt; {auction.categorySub}
        </h5>
        <p>
          {auction.sellerNickname} | {formatTime(auction.createdAt)}
        </p>
      </div>
      <hr />
      <div className="flex gap-2">
        <div>
          {auction.images.map((item) => (
            <img src={item.imageUrl} className="size-45" />
          ))}
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default AdminAuctionPost;
