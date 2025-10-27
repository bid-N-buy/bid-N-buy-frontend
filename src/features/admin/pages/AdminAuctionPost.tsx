import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuctionDetailStore } from "../../auction/store/auctionDetailStore";

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
    <div>
      <h2>{auction.title}</h2>
      <h5>{auction.sellerNickname}</h5>
      <hr />
      <p>{auction.description}</p>
    </div>
  );
};

export default AdminAuctionPost;
