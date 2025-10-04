import React from "react";
import ProductImage from "../components/ProductImage";
import ProductInfo from "../components/ProductInfo";
import RelatedItem from "../components/RelatedItem";
import ProductDetail from "../components/ProductDetail";
import AuctionGuide from "../components/AuctionGuide";

const AuctionDetail = () => {
  return (
    <div className="w-full space-y-[70px]">
      {/* 상 */}
      <section className="w-full pt-8 md:pt-12">
        <div className="grid grid-cols-12 gap-[30px]">
          {/* 좌측 - ProductImage */}
          <div className="col-span-12 md:col-span-6">
            <ProductImage />
          </div>
          {/* 우측 - ProductInfo */}
          <div className="col-span-12 md:col-span-6">
            <ProductInfo />
          </div>
        </div>
      </section>

      {/* 중단1 - ProductDetail */}
      <section className="w-full">
        <ProductDetail />
      </section>

      {/* 중단2 - AuctionGuide */}
      <section className="w-full">
        <AuctionGuide />
      </section>

      {/* 하단 - RelatedItem */}
      <section className="w-full">
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 xl:grid-cols-4">
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

// 파일 레이아웃 기준 (desktop)
// - 상단: 좌(이미지 645x500 근사) / 우(정보) - 열?
// - 중단: h-[232px]
// - 하단: 4열, 열 간격 30px, 각 카드 308 x 232
