import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AuctionDetail } from "../types/auctions";
import { getAuctionById } from "../api/auctions";
import ProductImage from "../components/ProductImage";
import ProductInfo from "../components/ProductInfo";
import ProductDetail from "../components/ProductDetail";
import AuctionGuide from "../components/AuctionGuide";
import RelatedItem from "../components/RelatedItem";

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleCardClick = (auctionId: number) => {
    console.log("상품 카드 클릭", auctionId);
    navigate(`/auction/${auctionId}`);
  };

  const handleLikeToggle = (auctionId: number, liked: boolean) => {
    console.log("좋아요 토글:", auctionId, liked);
    // api 호출
  };

  const handleAfterBid = React.useCallback(
    async (next: { currentPrice?: number }) => {
      // 일단 화면에 새 현재가 반영
      setAuction((prev) =>
        prev
          ? { ...prev, currentPrice: next.currentPrice ?? prev.currentPrice }
          : prev
      );

      // 서버 최신 데이터 재조회.. 새고 안 하고도 화면 반영되게
      try {
        const refreshed = await getAuctionById(Number(id));
        setAuction(refreshed);
      } catch {
        console.error("재조회 실패");
      }
    },
    [id]
  );

  if (loading) return <div className="text-g300 p-6">로딩 중...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!auction) return <div className="p-6">데이터가 없습니다.</div>;

  return (
    <div className="w-full space-y-10 md:space-y-[70px]">
      {/* 상단 */}
      <section className="w-full pt-8 md:pt-12">
        <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-[30px]">
          {/* 좌측 - ProductImage */}
          <div className="col-span-12 lg:col-span-6">
            <ProductImage images={auction.images} />
          </div>
          {/* 우측 - ProductInfo */}
          <div className="col-span-12 lg:col-span-6">
            <ProductInfo
              auctionId={auction.auctionId}
              title={auction.title}
              categoryMain={auction.categoryMain}
              categorySub={auction.categorySub}
              currentPrice={auction.currentPrice}
              minBidPrice={auction.minBidPrice}
              bidCount={auction.bidCount}
              startTime={auction.startTime}
              endTime={auction.endTime}
              sellerId={auction.sellerId}
              sellerNickname={auction.sellerNickname}
              sellerProfileImageUrl={auction.sellerProfileImageUrl}
              sellerTemperature={auction.sellerTemperature}
              sellingStatus={auction.sellingStatus}
              wishCount={auction.wishCount}
              onAfterBid={handleAfterBid}
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
        <RelatedItem
          items={[]} // todo 실제 데이터 전달
          onCardClick={handleCardClick}
          onLikeToggle={handleLikeToggle}
        />
      </section>
    </div>
  );
};

export default AuctionDetail;
