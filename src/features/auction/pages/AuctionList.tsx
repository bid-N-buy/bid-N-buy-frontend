import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuctionFilter from "../components/AuctionFilter";
import ProductCard from "../components/ProductCard";
import { useAuctionSearch } from "../hooks/useAuctionSearch";
import { useCategoryStore } from "../store/categoryStore";
import type { CategoryNode } from "../api/categories";
import type { AuctionItem } from "../types/auctions";
import { ChevronDown, Filter, X } from "lucide-react";

const PAGE_SIZE = 20;

const AuctionList = () => {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
  const subCategoryId = sp.get("subCategoryId")
    ? Number(sp.get("subCategoryId"))
    : undefined;
  const mainCategoryId = sp.get("subCategoryId")
    ? undefined
    : sp.get("mainCategoryId")
      ? Number(sp.get("mainCategoryId"))
      : undefined;

  // 카테고리
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

  const { items, loading, error, last, loadMore, topPrice } = useAuctionSearch({
    searchKeyword,
    mainCategoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    includeEnded,
    sortBy,
    size: PAGE_SIZE,
  });

  // 가격
  const priceCeil = Math.max(1000, topPrice || 1_000_000);

  const [tempMinPrice, setTempMinPrice] = useState<number>(minPrice ?? 0);
  const [tempMaxPrice, setTempMaxPrice] = useState<number>(
    maxPrice ?? priceCeil
  );

  useEffect(() => {
    const toMin = Math.max(0, Math.min(minPrice ?? 0, priceCeil));
    const toMax = Math.max(0, Math.min(maxPrice ?? priceCeil, priceCeil));
    const [lo, hi] = toMin <= toMax ? [toMin, toMax] : [toMax, toMin];
    setTempMinPrice(lo);
    setTempMaxPrice(hi);
  }, [minPrice, maxPrice, priceCeil]);

  // 카테고리 핸들러
  const handleCategorySelect = (
    mainId?: number,
    subId?: number,
    categoryName?: { main: string; sub?: string }
  ) => {
    const next = new URLSearchParams(sp);
    if (mainId) {
      next.delete("subCategoryId");
      next.set("mainCategoryId", String(mainId));
    } else if (subId) {
      next.delete("mainCategoryId");
      next.set("subCategoryId", String(subId));
    }
    setSp(next, { replace: false });
    if (categoryName) {
      setSelectedCategory(categoryName);
    }
    setIsFilterOpen(false);
  };

  // 가격 핸들러
  const handleApplyPrice = () => {
    const loRaw = Math.max(0, tempMinPrice);
    const hiRaw = Math.max(0, tempMaxPrice);
    const lo = Math.min(loRaw, priceCeil);
    const hi = Math.min(hiRaw, priceCeil);
    const [minOk, maxOk] = lo <= hi ? [lo, hi] : [hi, lo];

    const next = new URLSearchParams(sp);
    next.set("minPrice", String(minOk));
    next.set("maxPrice", String(maxOk));
    setSp(next, { replace: false });
    setIsFilterOpen(false);
  };

  // 완료/종료 포함
  const toggleIncludeEnded = () => {
    const next = new URLSearchParams(sp);
    includeEnded ? next.delete("includeEnded") : next.set("includeEnded", "1");
    setSp(next, { replace: false });
  };

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

  // 정렬
  const onChangeSort = (v: "latest" | "price_asc" | "price_desc") => {
    const next = new URLSearchParams(sp);
    next.set("sortBy", v);
    setSp(next, { replace: false });
  };

  const handleCardClick = (auctionId: number) =>
    navigate(`/auctions/${auctionId}`);

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
    <div className="container pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20">
      <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-4 sm:gap-7 lg:gap-10">
        {/* 데스크탑 - 사이드바ㅇ */}
        <aside className="hidden lg:col-span-6 lg:block xl:col-span-5">
          <AuctionFilter
            mains={mains}
            subsByParent={subsByParent}
            loadingTop={loadingTop}
            expandedCategory={expandedCategory}
            mainCategoryId={mainCategoryId}
            subCategoryId={subCategoryId}
            selectedCategory={selectedCategory}
            onExpand={onExpand}
            onCategorySelect={handleCategorySelect}
            priceCeil={priceCeil}
            tempMinPrice={tempMinPrice}
            tempMaxPrice={tempMaxPrice}
            setTempMinPrice={setTempMinPrice}
            setTempMaxPrice={setTempMaxPrice}
            onApplyPrice={handleApplyPrice}
            includeEnded={includeEnded}
            onToggleEnded={toggleIncludeEnded}
          />
        </aside>

        {/* 상품 목록 */}
        <main className="col-span-full lg:col-span-18 xl:col-span-19">
          {/* 상단 */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start justify-between gap-3">
              <div className="text-g100 flex-1 text-base leading-tight">
                <span className="font-bold">{resultTitle}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* 모바일 필터 버튼 */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="text-purple hover:text-deep-purple cursor-pointer p-1.5 transition-colors lg:hidden"
                  aria-label="필터"
                >
                  <Filter className="h-6 w-6" />
                </button>

                {/* 정렬 */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      onChangeSort(
                        e.target.value as "latest" | "price_asc" | "price_desc"
                      )
                    }
                    className="border-g400 text-g100 focus:border-purple sm:text-h7 text-h8 cursor-pointer appearance-none border bg-white py-1 pr-6 pl-2 focus:outline-none sm:py-1.5 sm:pr-7 sm:pl-2.5"
                  >
                    <option value="latest">최신순</option>
                    <option value="price_asc">가격낮은순&nbsp;</option>
                    <option value="price_desc">가격높은순&nbsp;</option>
                  </select>
                  <ChevronDown className="text-g300 pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* 상품 */}
          {error ? (
            <div className="text-red">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-9 xl:grid-cols-4">
                {items.map((product: AuctionItem) => (
                  <ProductCard
                    key={product.auctionId}
                    item={product}
                    onCardClick={handleCardClick}
                  />
                ))}

                {/* 스켈레톤 */}
                {loading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={`sk-${i}`} className="animate-pulse">
                      <div className="bg-g400 mb-3 aspect-square w-full rounded-3xl" />
                      <div className="bg-g400 h-4 w-3/4" />
                    </div>
                  ))}
              </div>

              {/* 무한스크롤 */}
              <div ref={sentinelRef} className="h-6" />
              {last && items.length > 0 && (
                <div className="text-g300 text-h7 mt-6 text-center">
                  마지막 페이지입니다.
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 모바일 필터 모달 */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            className="absolute top-0 right-0 h-full w-[70vw] max-w-sm overflow-y-auto bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-g100 text-h4 font-bold">필터</h4>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-g300 hover:text-purple cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AuctionFilter
              mains={mains}
              subsByParent={subsByParent}
              loadingTop={loadingTop}
              expandedCategory={expandedCategory}
              mainCategoryId={mainCategoryId}
              subCategoryId={subCategoryId}
              selectedCategory={selectedCategory}
              onExpand={onExpand}
              onCategorySelect={handleCategorySelect}
              priceCeil={priceCeil}
              tempMinPrice={tempMinPrice}
              tempMaxPrice={tempMaxPrice}
              setTempMinPrice={setTempMinPrice}
              setTempMaxPrice={setTempMaxPrice}
              onApplyPrice={handleApplyPrice}
              includeEnded={includeEnded}
              onToggleEnded={toggleIncludeEnded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionList;
