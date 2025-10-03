import React from "react";
import RelatedItem from "../components/RelatedItem";
import { Heart, EllipsisVertical } from "lucide-react";

const AuctionDetail = () => {
  return (
    <div className="w-full space-y-[70px]">
      {/* 상단 메인? 섹션 */}
      <section className="w-full pt-8 md:pt-12">
        {/* desktop */}
        <div className="grid grid-cols-12 gap-[30px]">
          {/* 좌측 이미지 (약 645 x 500) */}
          <div className="col-span-12 md:col-span-6">
            <div
              className="bg-g400 aspect-[645/500] w-full rounded-3xl"
              aria-label="이미지"
            />
          </div>

          {/* 우측: 정보 */}
          <div className="col-span-12 md:col-span-6">
            <div className="aspect-[645/500] w-full">
              <div className="flex h-full w-full flex-col justify-between gap-[30px]">
                {/* Top (134/500) = 26.8% */}
                <div
                  className="bg-g400 relative w-full"
                  style={{ height: "calc(100% * 134 / 500)" }}
                >
                  {/* 아이콘 */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      className="bg-g500/50 inline-flex size-9 items-center justify-center rounded-full"
                      aria-label="더보기"
                    >
                      <EllipsisVertical className="size-5" aria-hidden />
                    </button>
                  </div>
                </div>

                {/* Middle (80/500) = 16% */}
                <div
                  className="bg-g400 w-full"
                  style={{ height: "calc(100% * 80 / 500)" }}
                />

                {/* Bottom (226/500) = 45.2% */}
                <div
                  className="bg-g400 relative w-full"
                  style={{ height: "calc(100% * 226 / 500)" }}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      className="bg-g500/50 inline-flex size-9 items-center justify-center rounded-full"
                      aria-label="찜"
                    >
                      <Heart className="size-5" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 중단1 */}
      <section className="w-full">
        <div className="bg-g400 h-[232px]" aria-label="추가 정보 영역">
          중단1
        </div>
      </section>

      {/* 중단2 */}
      <section className="w-full">
        <div className="bg-g400 h-[232px]" aria-label="추가 정보 영역">
          중단2
        </div>
      </section>

      {/* 하단: 관련 상품 4열 (308 x 232, 열 간격 30px) */}
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
// - 하단: 4열, 열 간격 30px, 각 카드 h-[232px]
