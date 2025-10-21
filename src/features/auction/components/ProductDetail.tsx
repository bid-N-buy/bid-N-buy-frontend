import React from "react";

interface ProductDetailProps {
  description?: string;
}

const ProductDetail = ({ description }: ProductDetailProps) => {
  return (
    <section
      className="flex min-h-[232px] flex-col gap-1.5 px-1.5 sm:gap-1.5 sm:px-3 md:gap-2 lg:gap-4"
      aria-label="상품 설명 영역"
    >
      <span className="text-g100 text-h5 sm:text-h4 font-bold">상품 설명</span>

      {description ? (
        <p className="text-g100 text-h7 md:text-h6 px-2 leading-relaxed whitespace-pre-line sm:text-base">
          {description}
        </p>
      ) : (
        <p className="text-g300 text-h7 md:text-h6 sm:text-base">
          상품 설명이 없습니다.
        </p>
      )}
    </section>
  );
};

export default ProductDetail;
