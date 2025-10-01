import React from "react";
import RelatedCard from "../components/Test";

const AuctionDetail = () => {
  return (
    <div className="w-full">
      {/* 상단: 상품 상세 메인 섹션 */}
      <section className="w-full pt-8 md:pt-12">
        <div className="grid grid-cols-12 gap-[30px]">
          {/* 좌측: 메인 이미지 (645 x 500 근사) */}
          <div className="col-span-12 md:col-span-6">
            {/* 비율 고정: 645 / 500 ≈ 1.29, 높이 500px 고정 */}
            <div
              className="bg-g400 w-full rounded-2xl"
              style={{ aspectRatio: "645 / 500" }}
              aria-label="상품 메인 이미지"
            />
          </div>

          {/* 우측: 정보 블록 */}
          <div className="col-span-12 flex flex-col md:col-span-6">
            {/* 타이틀/가격 등: 레이아웃 정렬 확인용 스켈레톤 바 */}
            <div className="space-y-4">
              <div className="bg-g400 h-8 w-3/4 rounded" />
              <div className="bg-g400 h-6 w-1/2 rounded" />
              <div className="bg-g400 h-6 w-2/3 rounded" />
            </div>

            {/* 판매자/메타 정보 줄 (아바타 82x82 근사) */}
            <div className="mt-8 flex items-center gap-5">
              <div className="bg-g400 size-[82px] shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="bg-g400 h-5 w-1/3 rounded" />
                <div className="bg-g400 h-5 w-1/2 rounded" />
              </div>
            </div>

            {/* 액션 버튼 2개: 파일 기준 280 x 82, 간격 동일 */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                className="bg-purple h-[82px] rounded-xl font-medium text-white"
                aria-label="입찰하기"
              >
                {/* 텍스트는 임시, 정렬만 확인 */}
              </button>
              <button
                className="bg-purple h-[82px] rounded-xl font-medium text-white"
                aria-label="바로구매"
              >
                {/* 텍스트는 임시, 정렬만 확인 */}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 중단: 추가 정보(예: 경매 안내/배송/주의사항 등) */}
      <section className="mt-20 w-full">
        {/* 파일 기준: 1318 x 232, 라운드 20 */}
        <div
          className="bg-g400 h-[232px] rounded-2xl"
          aria-label="추가 정보 영역"
        />
      </section>

      {/* 하단: 관련 상품 4열 (308 x 232, 열 간격 30px) */}
      <section className="mt-10 w-full">
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 xl:grid-cols-4">
          <RelatedCard title="관련 상품 1" />
          <RelatedCard title="관련 상품 2" />
          <RelatedCard title="관련 상품 3" />
          <RelatedCard title="관련 상품 4" />
        </div>
      </section>
    </div>
  );
};

export default AuctionDetail;

// 파일 레이아웃 기준(데스크톱):
// - 전체 컨테이너: max-w-[1320px]
// - 상단 메인 섹션: 좌(이미지 645x500 근사) / 우(정보) 2열
// - 하단 정보 박스: h-[232px] 라운드
// - 관련 상품 4열: 각 카드 h-[232px], 열 간격 30px
