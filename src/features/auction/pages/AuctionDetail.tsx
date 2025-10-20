import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import ProductInfo from "../components/ProductInfo";
import ProductDetail from "../components/ProductDetail";
import AuctionGuide from "../components/AuctionGuide";
import RelatedItem from "../components/RelatedItem";
import { useAuctionDetailStore } from "../store/auctionDetailStore";
import { useAuthStore } from "../../auth/store/authStore";

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const authKey = useAuthStore((s) => s.userId ?? null);
  const {
    detail: auction,
    loading,
    error,
    load,
    reset,
    patch,
  } = useAuctionDetailStore();

  useEffect(() => {
    if (!id) return;
    reset();
    load(Number(id));
  }, [id, reset, load]);

  // 로그인/로그아웃 시 재조회(liked 반영)
  useEffect(() => {
    if (!id) return;
    load(Number(id));
  }, [id, authKey, load]);

  const handleCardClick = (auctionId: number) => {
    navigate(`/auctions/${auctionId}`);
  };

  const handleAfterBid = React.useCallback(
    async (next: { currentPrice?: number }) => {
      // 일단 화면 낙관적 업데이트 (현재가, 입찰횟수 +1)
      patch((prev) => ({
        currentPrice: next.currentPrice ?? prev.currentPrice,
        bidCount: (prev.bidCount ?? 0) + 1,
      }));

      // 서버 최신값으로 교정
      if (id) {
        await load(Number(id));
      }
    },
    [id, load, patch]
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
              liked={auction.liked}
              onAfterBid={handleAfterBid}
              isSeller={userId === auction.sellerId}
              // 삭제 성공 후 처리
              onDeleteClick={() => {
                reset(); // 상세 캐시 비우기
                navigate("/", { replace: true }); // 메인으로
              }}
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
        />
      </section>
    </div>
  );
};

export default AuctionDetail;
