// todo 슬라이드
import React, { useMemo } from "react";
import type { AuctionImage } from "../types/auctions";
import { buildImageUrl } from "../../../shared/utils/imageUrl";

interface ProductImageProps {
  // 서버 스키마 그대로 쓰고 싶으면
  images?: AuctionImage[]; // [{ imageUrl, imageType }]
  // 문자열 배열 쓰는 경우도 호환하려면 허용
  imageUrls?: string[]; // ["...", "..."]
  // todo 추후 제거
  mainImageUrl?: string;
}

const ProductImage = ({
  images,
  imageUrls,
  mainImageUrl,
}: ProductImageProps) => {
  // 우선순위 images -> imageUrls -> mainImageUrl
  const src = useMemo(() => {
    const fromImages = images?.[0]?.imageUrl;
    const fromArray = imageUrls?.[0];
    return (
      buildImageUrl(fromImages ?? fromArray ?? mainImageUrl ?? null) ??
      undefined
    );
  }, [images, imageUrls, mainImageUrl]);

  if (!src) {
    return (
      <div
        aria-label="이미지 없음"
        className="bg-g400 aspect-[645/500] w-full rounded-3xl"
      />
    );
  }

  return (
    <div
      aria-label="상품 이미지"
      className="aspect-[645/500] w-full overflow-hidden rounded-3xl"
    >
      <img src={src} alt="상품 이미지" className="h-full w-full object-cover" />
    </div>
  );
};

export default ProductImage;
