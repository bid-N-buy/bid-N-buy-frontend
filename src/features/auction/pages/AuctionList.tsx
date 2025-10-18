import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuctionSearch } from "../hooks/useAuctionSearch";
import { useCategoryStore } from "../store/categoryStore";
import type { CategoryNode } from "../api/categories";
import type { AuctionItem } from "../types/auctions";

// todo 이거 처리할 것..
const MAX_PRICE = 500000;
const PAGE_SIZE = 20;

const AuctionList = () => {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  // url 파라미터
  const searchKeyword = sp.get("searchKeyword") ?? undefined;

  // 필터
  const sortBy = (sp.get("sortBy") ?? "latest") as
    | "latest"
    | "price_asc"
    | "price_desc";
  const minPrice = sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined;
  const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined;
  const includeEnded = sp.get("includeEnded") === "1";
  const subCategoryId = sp.get("subCategoryId") // 카테고리 - 소분류 우선, 없으면 대분류
    ? Number(sp.get("subCategoryId"))
    : undefined;
  const mainCategoryId = sp.get("subCategoryId")
    ? undefined
    : sp.get("mainCategoryId")
      ? Number(sp.get("mainCategoryId"))
      : undefined;

  // 가격 - 버튼 클릭 시 반영
  const [tempMinPrice, setTempMinPrice] = useState<number>(minPrice ?? 0);
  const [tempMaxPrice, setTempMaxPrice] = useState<number>(
    maxPrice ?? MAX_PRICE
  );

  useEffect(() => {
    setTempMinPrice(minPrice ?? 0);
    setTempMaxPrice(maxPrice ?? MAX_PRICE);
  }, [minPrice, maxPrice]);

  const applyPriceFilter = () => {
    const lo = Math.max(0, Math.min(tempMinPrice, MAX_PRICE));
    const hi = Math.max(0, Math.min(tempMaxPrice, MAX_PRICE));
    const [minOk, maxOk] = lo <= hi ? [lo, hi] : [hi, lo];

    const next = new URLSearchParams(sp);
    next.set("minPrice", String(minOk));
    next.set("maxPrice", String(maxOk));
    setSp(next, { replace: false });
  };

  // 카테고리 스토어
  const { mains, subsByParent, loadingTop, loadTop, loadSubs } =
    useCategoryStore();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{
    main: string;
    sub?: string;
  } | null>(null);

  useEffect(() => {
    loadTop().catch(() => {});
  }, [loadTop]);

  const onExpand = async (m: CategoryNode) => {
    const isOpen = expandedCategory === String(m.categoryId);
    setExpandedCategory(isOpen ? null : String(m.categoryId));
    if (!subsByParent[m.categoryId]?.length) {
      await loadSubs(m.categoryId).catch(() => {});
    }
  };

  useEffect(() => {
    if (mainCategoryId && mains.length > 0) {
      const m = mains.find((x) => x.categoryId === mainCategoryId);
      if (m) {
        setSelectedCategory({ main: m.categoryName });
        setExpandedCategory(String(m.categoryId));
      }
    }

    (async () => {
      if (!subCategoryId || mains.length === 0) return;

      for (const m of mains) {
        if (!subsByParent[m.categoryId]) {
          await loadSubs(m.categoryId).catch(() => {});
        }
        const subs = subsByParent[m.categoryId] ?? [];
        const s = subs.find((x) => x.categoryId === subCategoryId);
        if (s) {
          setSelectedCategory({ main: m.categoryName, sub: s.categoryName });
          setExpandedCategory(String(m.categoryId));
          break;
        }
      }
    })();
  }, [mainCategoryId, subCategoryId, mains, subsByParent, loadSubs]);

  const { items, loading, error, last, loadMore, setPage, setItems } =
    useAuctionSearch({
      searchKeyword,
      mainCategoryId,
      subCategoryId,
      minPrice,
      maxPrice,
      includeEnded,
      sortBy,
      size: PAGE_SIZE,
    });

  // URL 파라미터 변경 시 리스트 초기화(보조)
  useEffect(() => {
    setItems([]);
    setPage(0);
  }, [
    searchKeyword,
    mainCategoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    includeEnded,
    sortBy,
    setItems,
    setPage,
  ]);

  // 무한스크롤
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !last) loadMore();
      },
      { rootMargin: "200px" }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [loadMore, loading, last]);

  // 완료/종료 포함 토글
  const toggleIncludeEnded = () => {
    const next = new URLSearchParams(sp);
    includeEnded ? next.delete("includeEnded") : next.set("includeEnded", "1");
    setSp(next, { replace: false });
  };

  // 정렬
  const onChangeSort = (v: "latest" | "price_asc" | "price_desc") => {
    const next = new URLSearchParams(sp);
    next.set("sortBy", v);
    setSp(next, { replace: false });
  };

  const handleCardClick = (auctionId: number) =>
    navigate(`/auctions/${auctionId}`);

  const handleLikeToggle = (_auctionId: number, _liked: boolean) => {
    // todo 위시 토글 api 붙일 때 optimistic 업데이트
  };

  // 상단에 오는 거.. todo 고민해보고..
  const resultTitle = useMemo(() => {
    const hasCategory = !!(
      mainCategoryId ||
      subCategoryId ||
      selectedCategory?.main
    );
    if (searchKeyword && hasCategory) {
      const cat = selectedCategory?.sub
        ? `${selectedCategory.main} > ${selectedCategory.sub}`
        : selectedCategory?.main
          ? selectedCategory.main
          : subCategoryId
            ? "선택한 소분류"
            : mainCategoryId
              ? "선택한 대분류"
              : "카테고리";
      return `"${searchKeyword}" + ${cat} 결과`;
    }
    if (searchKeyword) return `"${searchKeyword}" 검색 결과`;
    if (selectedCategory?.sub)
      return `${selectedCategory.main} > ${selectedCategory.sub}`;
    if (selectedCategory?.main) return `${selectedCategory.main}`;
    if (subCategoryId) return "선택한 소분류 결과";
    if (mainCategoryId) return "선택한 대분류 결과";
    return "전체 경매";
  }, [searchKeyword, selectedCategory, mainCategoryId, subCategoryId]);

  return (
    <div className="container py-10">
      <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-10">
        {/* 사이드바 */}
        <aside className="col-span-5">
          <div className="flex flex-col gap-8">
            {/* 카테고리 */}
            <div className="flex flex-col gap-4">
              <div className="text-g100 text-h5 leading-tight font-bold">
                카테고리
              </div>

              {loadingTop ? (
                <div className="text-g300 text-sm">불러오는 중…</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {mains.map((m: CategoryNode) => {
                    const isOpen = expandedCategory === String(m.categoryId);
                    const subs = subsByParent[m.categoryId] ?? [];

                    return (
                      <div key={m.categoryId} className="flex flex-col">
                        {/* 대분류 */}
                        <button
                          onClick={() => onExpand(m)}
                          className={`text-g100 hover:text-purple flex items-center justify-between py-1 text-left text-base transition-colors ${
                            !subCategoryId && mainCategoryId === m.categoryId
                              ? "text-purple font-semibold"
                              : ""
                          }`}
                        >
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = new URLSearchParams(sp);
                              next.delete("subCategoryId");
                              next.set("mainCategoryId", String(m.categoryId));
                              setSp(next, { replace: false });
                              setSelectedCategory({ main: m.categoryName });
                            }}
                          >
                            {m.categoryName}
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                          />
                        </button>

                        {/* 소분류 */}
                        {isOpen && (
                          <div className="mt-2 flex flex-col gap-2 pl-4">
                            {subs.map((s) => (
                              <button
                                key={s.categoryId}
                                onClick={() => {
                                  const next = new URLSearchParams(sp);
                                  next.delete("mainCategoryId");
                                  next.set(
                                    "subCategoryId",
                                    String(s.categoryId)
                                  );
                                  setSp(next, { replace: false });
                                  setSelectedCategory({
                                    main: m.categoryName,
                                    sub: s.categoryName,
                                  });
                                }}
                                className={`py-1 text-left transition-colors ${
                                  subCategoryId === s.categoryId
                                    ? "text-purple font-medium"
                                    : "text-g200 hover:text-purple"
                                } text-h7`}
                              >
                                {s.categoryName}
                              </button>
                            ))}
                            {subs.length === 0 && (
                              <div className="text-g300 text-h7 py-1">
                                소분류 없음
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 가격 필터 */}
            <div className="flex flex-col gap-4">
              <div className="text-g100 text-h5 leading-tight font-bold">
                가격
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-g400 relative h-1 rounded-md">
                  <div
                    className="bg-purple absolute h-1 rounded-md"
                    style={{
                      left: `${(tempMinPrice / MAX_PRICE) * 100}%`,
                      right: `${100 - (tempMaxPrice / MAX_PRICE) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={MAX_PRICE}
                    step="1000"
                    value={tempMinPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v < tempMaxPrice) setTempMinPrice(v);
                    }}
                    className="[&::-webkit-slider-thumb]:bg-purple pointer-events-none absolute h-1 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                  />
                  <input
                    type="range"
                    min="0"
                    max={MAX_PRICE}
                    step="1000"
                    value={tempMaxPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > tempMinPrice) setTempMaxPrice(v);
                    }}
                    className="[&::-webkit-slider-thumb]:bg-purple pointer-events-none absolute h-1 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow"
                  />
                </div>
                <div className="text-purple text-h7 text-center font-medium">
                  현재가 : {tempMinPrice.toLocaleString()}원 ~{" "}
                  {tempMaxPrice.toLocaleString()}원
                </div>
              </div>
              <button
                onClick={applyPriceFilter}
                className="bg-purple hover:bg-purple/90 rounded-md py-2 text-base font-medium text-white transition-colors"
              >
                적용
              </button>
            </div>

            {/* 완료/종료 포함 */}
            <div className="flex flex-col gap-4">
              <button
                onClick={toggleIncludeEnded}
                className={`rounded-md px-4 py-2.5 text-base font-medium transition-colors ${
                  includeEnded
                    ? "bg-purple text-white"
                    : "border-purple text-purple hover:bg-light-purple cursor-pointer border"
                }`}
              >
                완료/종료 포함
              </button>
            </div>
          </div>
        </aside>

        {/* 상품 목록 */}
        <main className="col-span-19">
          {/* 상단 */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="text-g100 text-base leading-tight">
                <span className="font-bold">{resultTitle}</span>
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    onChangeSort(
                      e.target.value as "latest" | "price_asc" | "price_desc"
                    )
                  }
                  className="border-g400 text-g100 focus:border-purple text-h7 cursor-pointer appearance-none border bg-white py-1.5 pr-7 pl-2.5 focus:outline-none"
                >
                  <option value="latest">최신순</option>
                  <option value="price_asc">가격낮은순&nbsp;</option>
                  <option value="price_desc">가격높은순&nbsp;</option>
                </select>
                <ChevronDown className="text-g300 pointer-events-none absolute top-1/2 right-2.5 h-3 w-3 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* 상품 */}
          {error ? (
            <div className="text-red">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-x-7 gap-y-9">
                {items.map((product: AuctionItem) => (
                  <ProductCard
                    key={product.auctionId}
                    item={product}
                    liked={false}
                    onCardClick={handleCardClick}
                    onLikeToggle={handleLikeToggle}
                  />
                ))}

                {/* 스켈레톤 */}
                {loading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={`sk-${i}`} className="animate-pulse">
                      <div className="bg-g400 mb-3 aspect-[4/3] w-full" />
                      <div className="bg-g400 h-4 w-3/4" />
                    </div>
                  ))}
              </div>

              {/* 무한스크롤 */}
              <div ref={sentinelRef} className="h-6" />
              {last && items.length > 0 && (
                <div className="text-g300 mt-6 text-center text-sm">
                  마지막 페이지입니다.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AuctionList;
