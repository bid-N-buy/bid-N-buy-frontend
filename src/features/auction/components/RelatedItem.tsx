// todo 이거 어떻게 처리할지 정해야
import React from "react";
import ProductCard from "./ProductCard";
import type { AuctionItem } from "../types/auctions";

type RelatedItemProps = {
  items?: AuctionItem[];
  onCardClick?: (id: number) => void;
  onLikeToggle?: (id: number, liked: boolean) => void;
};

const RelatedItem = ({
  items = [],
  onCardClick,
  onLikeToggle,
}: RelatedItemProps) => {
  // 더미데이터
  const dummyItems: AuctionItem[] = Array(4)
    .fill(null)
    .map((_, i) => ({
      auctionId: i + 1,
      title: "관련 상품 제목",
      currentPrice: 50000,
      endTime: "2025-10-20T10:00:00",
      mainImageUrl: null,
      sellingStatus: "진행중" as const,
      sellerNickname: "판매자",
      wishCount: 10,
    }));

  const displayItems = items.length > 0 ? items : dummyItems;

  return (
    <section
      className="flex flex-col gap-1.5 px-1.5 sm:gap-1.5 sm:px-3 md:gap-2 lg:gap-3.5"
      aria-label="연관 상품"
    >
      <span className="text-g100 text-h5 sm:text-h4 font-bold">
        이런 상품은 어때요?
      </span>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-[30px] xl:grid-cols-4">
        {displayItems.map((item) => (
          <ProductCard
            key={item.auctionId}
            item={item}
            liked={false}
            onCardClick={onCardClick}
            onLikeToggle={onLikeToggle}
          />
        ))}
      </div>
    </section>
  );
};

export default RelatedItem;
