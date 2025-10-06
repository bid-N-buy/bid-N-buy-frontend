import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import type { AuctionResponse } from "../types/product";

interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

interface SelectedCategory {
  main: string;
  sub: string;
}

const AuctionList = () => {
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [filterIncluded, setFilterIncluded] = useState<boolean>(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory | null>(null);

  // 카테고리 데이터
  const categories: Category[] = [
    {
      id: "fashion",
      name: "패션",
      subcategories: ["의류", "신발", "가방", "액세서리"],
    },
    {
      id: "furniture",
      name: "가구",
      subcategories: ["의자", "책상", "침대", "수납"],
    },
    {
      id: "digital",
      name: "디지털",
      subcategories: ["스마트폰", "노트북", "태블릿", "카메라"],
    },
    {
      id: "voucher",
      name: "상품권",
      subcategories: ["백화점", "편의점", "외식", "문화"],
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const selectSubcategory = (categoryName: string, subcategoryName: string) => {
    setSelectedCategory({ main: categoryName, sub: subcategoryName });
  };

  // 더미 데이터 (추후 교체)
  const products: (AuctionResponse & {
    nickname: string;
    likeCount: number;
    chatCount: number;
    liked: boolean;
  })[] = Array(8)
    .fill(null)
    .map((_, i) => ({
      auctionId: i,
      title: "상품명",
      currentPrice: 25000,
      endTime: "2025-10-02T10:00:00",
      mainImageUrl: null,
      sellingStatus: "진행중",
      categoryName: "취미/게임",
      nickname: "판매자명",
      likeCount: Math.floor(Math.random() * 20),
      chatCount: Math.floor(Math.random() * 10),
      liked: i === 1 || i === 3 || i === 5,
    }));

  const handleCardClick = (auctionId: number) => {
    console.log("카드 클릭:", auctionId);
    // navigate(`/auction/${auctionId}`);
  };

  const handleLikeToggle = (auctionId: number, liked: boolean) => {
    console.log("좋아요 토글:", auctionId, liked);
    // API 호출
  };

  return (
    <div className="container py-10">
      <div className="flex gap-10">
        {/* 사이드바 */}
        <aside className="w-[200px] flex-shrink-0">
          <div className="flex flex-col gap-8">
            {/* 체크박스 - 수정 필요 */}
            <div className="flex flex-col gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterIncluded}
                  onChange={(e) => setFilterIncluded(e.target.checked)}
                  className="accent-purple h-[18px] w-[18px] cursor-pointer"
                />
                <span className="text-purple text-[15px] font-medium">
                  필터/옵션 포함
                </span>
              </label>
            </div>

            {/* 가격 */}
            <div className="flex flex-col gap-4">
              <div className="bg-g400 relative h-1 rounded">
                {/* 구간 */}
                <div
                  className="bg-purple absolute h-1 rounded"
                  style={{
                    left: `${(minPrice / 30000) * 100}%`,
                    right: `${100 - (maxPrice / 30000) * 100}%`,
                  }}
                />
                {/* 최소 */}
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="1000"
                  value={minPrice}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value < maxPrice) setMinPrice(value);
                  }}
                  className="[&::-webkit-slider-thumb]:bg-purple pointer-events-none absolute h-1 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                />
                {/* 최대 */}
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value > minPrice) setMaxPrice(value);
                  }}
                  className="[&::-webkit-slider-thumb]:bg-purple pointer-events-none absolute h-1 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                />
              </div>
              <div className="text-purple text-[13px] font-medium">
                현재가 : {minPrice.toLocaleString()}원 ~{" "}
                {maxPrice.toLocaleString()}원
              </div>
            </div>

            <div className="border-g400 border-t"></div>

            {/* 카테고리 */}
            <div className="flex flex-col gap-4">
              <h6 className="text-g100 font-bold">카테고리</h6>
              <div className="flex flex-col gap-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex flex-col">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="text-g100 hover:text-purple flex items-center justify-between py-1 text-left text-[15px] transition-colors"
                    >
                      <span>{category.name}</span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${
                          expandedCategory === category.id ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {expandedCategory === category.id && (
                      <div className="mt-2 flex flex-col gap-2 pl-4">
                        {category.subcategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() =>
                              selectSubcategory(category.name, sub)
                            }
                            className={`py-1 text-left text-[14px] transition-colors ${
                              selectedCategory?.main === category.name &&
                              selectedCategory?.sub === sub
                                ? "text-purple font-medium"
                                : "text-g200 hover:text-purple"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* 상품 목록 */}
        <main className="flex-1">
          {/* 상단 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="text-g100 text-[17px]">
                <span className="font-bold">"아이템"</span>
                <span> 검색 결과 </span>
                <span className="font-medium">8,000 건</span>
              </div>
              <div className="relative">
                <select className="border-g400 text-g100 focus:border-purple cursor-pointer appearance-none border bg-white py-2 pr-10 pl-4 text-[15px] focus:outline-none">
                  <option>최신순</option>
                  <option>가격낮은순</option>
                  <option>가격높은순</option>
                </select>
                <ChevronDown className="text-g300 pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
            {selectedCategory && (
              <div className="text-g300 mt-3 text-[15px]">
                {selectedCategory.main} &gt; {selectedCategory.sub}
              </div>
            )}
          </div>

          {/* 상품 그리드 */}
          <div className="grid grid-cols-4 gap-x-5 gap-y-8">
            {products.map((product) => (
              <ProductCard
                key={product.auctionId}
                auctionId={product.auctionId}
                title={product.title}
                currentPrice={product.currentPrice}
                mainImageUrl={product.mainImageUrl}
                sellingStatus={product.sellingStatus}
                nickname={product.nickname}
                likeCount={product.likeCount}
                chatCount={product.chatCount}
                liked={product.liked}
                onCardClick={handleCardClick}
                onLikeToggle={handleLikeToggle}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuctionList;
