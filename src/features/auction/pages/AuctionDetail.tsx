import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuctionById } from "../api/auctions";
import type { AuctionDetail } from "../types/auctions";
import ProductImage from "../components/ProductImage";
import ProductInfo from "../components/ProductInfo";
import RelatedItem from "../components/RelatedItem";
import ProductDetail from "../components/ProductDetail";
import AuctionGuide from "../components/AuctionGuide";

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await getAuctionById(Number(id));
        setAuction(data);
      } catch (err) {
        setError("데이터를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="text-g300 p-6">로딩 중...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!auction) return <div className="p-6">데이터가 없습니다.</div>;

  return (
    <div className="w-full space-y-10 md:space-y-[70px]">
      {/* 상 */}
      <section className="w-full pt-8 md:pt-12">
        <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-[30px]">
          {/* 좌측 - ProductImage */}
          <div className="col-span-12 lg:col-span-6">
            <ProductImage mainImageUrl={auction.mainImageUrl} />
          </div>
          {/* 우측 - ProductInfo */}
          <div className="col-span-12 lg:col-span-6">
            <ProductInfo
              title={auction.title}
              categoryMain={auction.categoryName}
              sellerNickname={auction.sellerNickname}
              currentPrice={auction.currentPrice}
              minBidPrice={auction.minBidPrice}
              endTime={auction.endTime}
              wishCount={auction.wishCount}
              sellingStatus={auction.sellingStatus}
              auctionId={0}
              sellerId={""}
            />
          </div>
        </div>
      </section>

      {/* 중단1 - ProductDetail */}
      <section className="w-full">
        <ProductDetail description={auction.description} />
      </section>

      {/* 중단2 - AuctionGuide */}
      <section className="w-full">
        <AuctionGuide />
      </section>

      {/* 하단 - RelatedItem */}
      <section className="w-full">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-[30px] xl:grid-cols-4">
          <RelatedItem title="관련 상품 1" />
          <RelatedItem title="관련 상품 2" />
          <RelatedItem title="관련 상품 3" />
          <RelatedItem title="관련 상품 4" />
        </div>
      </section>
    </div>
  );
};

export default AuctionDetail;
