import React from "react";
import ProductImage from "../components/ProductImage";
import ProductInfo from "../components/ProductInfo";
import RelatedItem from "../components/RelatedItem";
import ProductDetail from "../components/ProductDetail";
import AuctionGuide from "../components/AuctionGuide";

const AuctionDetail = () => {
  return (
    <div className="w-full space-y-10 md:space-y-[70px]">
      {/* 상 */}
      <section className="w-full pt-8 md:pt-12">
        <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-[30px]">
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
