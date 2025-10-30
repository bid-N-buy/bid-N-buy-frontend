import React from "react";
import { ChevronRight } from "lucide-react";
import type { CategoryNode } from "../api/categories";

interface AuctionFilterProps {
  // 카테고리
  mains: CategoryNode[];
  subsByParent: Record<number, CategoryNode[]>;
  loadingTop: boolean;
  expandedCategory: string | null;
  mainCategoryId?: number;
  subCategoryId?: number;
  selectedCategory: { main: string; sub?: string } | null;
  onExpand: (m: CategoryNode) => void;
  onCategorySelect: (
    mainId?: number,
    subId?: number,
    categoryName?: { main: string; sub?: string }
  ) => void;

  // 가격
  priceCeil: number;
  tempMinPrice: number;
  tempMaxPrice: number;
  setTempMinPrice: (v: number) => void;
  setTempMaxPrice: (v: number) => void;
  onApplyPrice: () => void;

  // 완료/종료
  includeEnded: boolean;
  onToggleEnded: () => void;
}

const AuctionFilter = ({
  mains,
  subsByParent,
  loadingTop,
  expandedCategory,
  mainCategoryId,
  subCategoryId,
  selectedCategory,
  onExpand,
  onCategorySelect,
  priceCeil,
  tempMinPrice,
  tempMaxPrice,
  setTempMinPrice,
  setTempMaxPrice,
  onApplyPrice,
  includeEnded,
  onToggleEnded,
}: AuctionFilterProps) => {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* 카테고리 */}
      <div className="flex flex-col gap-4">
        <div className="text-g100 text-h5 leading-tight font-bold">
          카테고리
        </div>

        {loadingTop ? (
          <div className="text-g300 text-h7">불러오는 중…</div>
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
                    className={`text-g100 hover:text-purple flex cursor-pointer items-center justify-between py-1 text-left text-base transition-colors ${
                      !subCategoryId && mainCategoryId === m.categoryId
                        ? "text-purple font-semibold"
                        : ""
                    }`}
                  >
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategorySelect(m.categoryId, undefined, {
                          main: m.categoryName,
                        });
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
                            onCategorySelect(undefined, s.categoryId, {
                              main: m.categoryName,
                              sub: s.categoryName,
                            });
                          }}
                          className={`cursor-pointer py-1 text-left transition-colors ${
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

      {/* 가격 */}
      <div className="flex flex-col gap-4">
        <div className="text-g100 text-h5 leading-tight font-bold">가격</div>
        <div className="flex flex-col gap-4">
          <div className="bg-g400 relative h-1 rounded-md">
            <div
              className="bg-purple absolute h-1 rounded-md"
              style={{
                left: `${(priceCeil ? tempMinPrice / priceCeil : 0) * 100}%`,
                right: `${100 - (priceCeil ? (tempMaxPrice / priceCeil) * 100 : 0)}%`,
              }}
            />
            <input
              type="range"
              min="0"
              max={priceCeil}
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
              max={priceCeil}
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
          onClick={onApplyPrice}
          className="bg-purple hover:bg-deep-purple cursor-pointer rounded-md py-2 text-base font-medium text-white transition-colors"
        >
          적용
        </button>
      </div>

      {/* 완료/종료 */}
      <div className="flex flex-col gap-4">
        <label className="group flex cursor-pointer items-center justify-between">
          <span className="text-g100 group-hover:text-purple text-base font-semibold transition-colors">
            완료/종료 포함
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={includeEnded}
            onClick={onToggleEnded}
            className={`relative inline-flex h-6.5 w-10.5 cursor-pointer items-center rounded-full transition-colors ${
              includeEnded ? "bg-purple" : "bg-g400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                includeEnded ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
};

export default AuctionFilter;
