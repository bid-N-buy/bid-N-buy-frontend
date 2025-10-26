import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { fetchAuctions, type FetchAuctionsParams } from "../api/auctions";
import type { AuctionItem } from "../types/auctions";

type RelatedItemProps = {
  mainCategoryId?: number; // 카테고리 id
  currentAuctionId?: number; // 현재 상품 제외
  onCardClick?: (id: number) => void;
};

const RelatedItem = ({
  mainCategoryId,
  currentAuctionId,
  onCardClick,
}: RelatedItemProps) => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mainCategoryId) return;

    const fetchRelated = async () => {
      try {
        setLoading(true);
        const query: FetchAuctionsParams = {
          mainCategoryId,
          sortBy: "latest",
          includeEnded: false,
          page: 0,
          size: 5, // 현재 상품 제외 가능성 고려해 5개 요청
        };
        const data = await fetchAuctions(query);
        const list =
          (data as any).data ??
          (data as any).items ??
          (data as any).content ??
          [];

        // 현재 상품 제외하고 4개만
        const filtered = (list as AuctionItem[])
          .filter((item) => item.auctionId !== currentAuctionId)
          .slice(0, 4);

        setItems(filtered);
      } catch (error) {
        console.error("연관 상품 불러오기 실패:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [mainCategoryId, currentAuctionId]);

  // 연관 상품 없으면 섹션 자체를 숨김
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section
      className="flex flex-col gap-3.5 px-1.5 pb-10 sm:px-3 md:pb-15 lg:gap-6"
      aria-label="연관 상품"
    >
      <span className="text-g100 text-h5 sm:text-h4 font-bold">
        이런 상품은 어때요?
      </span>

      {loading ? (
        // 로딩 스켈레톤
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-[30px] xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-g500/60 aspect-square w-full rounded-2xl" />
              <div className="bg-g500/60 mt-3 h-4 w-3/4 rounded" />
              <div className="bg-g500/60 mt-2 h-5 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : (
        // 상품 목록
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-[30px] xl:grid-cols-4">
          {items.map((item) => (
            <ProductCard
              key={item.auctionId}
              item={item}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default RelatedItem;
