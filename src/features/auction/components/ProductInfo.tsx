// *****todo 시작 시간 마감 시간 입찰 회수 추가*****
// todo 컴포넌트 분리
import React, { useState } from "react";
import BidModal from "./BidModal";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import { EllipsisVertical, Heart } from "lucide-react";

interface ProductInfoProps {
  categoryMain?: string;
  categorySub?: string;
  title?: string;
  sellerNickname?: string;
  sellerTemperature?: number;
  sellerProfileImage?: string;
  currentPrice?: number;
  minBidUnit?: number;
  liked?: boolean;
  isSeller?: boolean;
  onLikeToggle?: () => void;
  onChatClick?: () => void;
  onShareClick?: () => void;
  onDeleteClick?: () => void;
}

const ProductInfo = ({
  categoryMain = "카테고리(대)",
  categorySub = "카테고리(소)",
  title = "제품명",
  sellerNickname = "닉네임",
  sellerTemperature = 0,
  sellerProfileImage,
  currentPrice = 32000,
  minBidUnit = 1000,
  liked = false,
  isSeller = false,
  onLikeToggle,
  onChatClick,
  onShareClick,
  onDeleteClick,
}: ProductInfoProps) => {
  const [isLiked, setIsLiked] = useState(liked);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleLikeClick = () => {
    setIsLiked((prev) => !prev);
    onLikeToggle?.();
  };

  const handleBidSubmit = (bidPrice: number) => {
    if (bidPrice === 0) {
      showToast("입찰 가능 금액 이상 입력해 주세요.", "error");
      return;
    }

    // 여기서 API 호출 (추후 구현)
    console.log("입찰가: ", bidPrice);

    showToast("정상적으로 입찰되었습니다.", "success");
    setIsBidModalOpen(false);
  };

  return (
    <>
      <div className="w-full lg:aspect-[645/500]">
        <div className="flex h-full flex-col justify-between gap-5 px-4 py-5 md:gap-[30px] md:px-[10px] md:py-[20px]">
          {/* Top 카테고리, 제목 */}
          <div className="relative flex flex-[2] flex-col gap-2 md:gap-3">
            <div className="text-g300 text-h5">
              {categoryMain} &gt; {categorySub}
            </div>

            <h3 className="text-g100 text-h2 max-w-full truncate pr-10 leading-snug font-bold md:pr-12 md:leading-tight">
              {title}
            </h3>

            {/* 더보기? 아이콘 - todo 분리 */}
            <div className="absolute top-0 right-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:bg-g500/50 rounded-full p-2 transition-colors"
                aria-label="더보기"
              >
                <EllipsisVertical className="text-g200 h-7 w-7 md:h-8 md:w-8" />
              </button>

              {isMenuOpen && (
                <div className="border-g400 absolute top-full right-0 z-10 mt-2 w-32 rounded-md border bg-white shadow-lg">
                  <button
                    onClick={() => {
                      onShareClick?.();
                      setIsMenuOpen(false);
                    }}
                    className="text-g100 hover:bg-g500 w-full px-4 py-2.5 text-left text-base transition-colors md:py-3"
                  >
                    공유
                  </button>
                  {isSeller && (
                    <button
                      onClick={() => {
                        onDeleteClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="border-g400 text-red hover:bg-g500 w-full border-t px-4 py-2.5 text-left text-base transition-colors md:py-3"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle 판매자 정보 - todo 분리 */}
          <div className="flex flex-[1] items-center gap-4 md:gap-5">
            <div className="bg-g500 h-16 w-16 flex-shrink-0 overflow-hidden rounded-full md:h-20 md:w-20">
              {sellerProfileImage ? (
                <img
                  src={sellerProfileImage}
                  alt={sellerNickname}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <span className="text-g100 text-h4 max-w-[50vw] truncate font-medium md:max-w-none">
                {sellerNickname}
              </span>
              <span className="text-g300 text-h5 whitespace-nowrap">
                {sellerTemperature}°C
              </span>
            </div>
          </div>

          {/* Bottom 가격, 버튼 등 */}
          <div className="flex flex-[3] flex-col justify-end gap-4 md:gap-[33px]">
            <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
              <span className="text-g100 text-h2 leading-tight font-bold">
                현재
              </span>
              <span className="text-g100 text-h2 leading-tight font-bold">
                {currentPrice.toLocaleString()}원
              </span>
              <span className="text-g300 text-h5 whitespace-nowrap">
                (최소 입찰 단위 : {minBidUnit.toLocaleString()}원)
              </span>
            </div>

            <div className="flex items-stretch gap-2 md:gap-1.5">
              <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
                <button
                  onClick={onChatClick}
                  className="text-h5 border-purple text-purple hover:bg-light-purple cursor-pointer rounded-md border py-3 font-bold transition-colors md:py-4"
                >
                  판매자와 대화
                </button>
                <button
                  onClick={() => setIsBidModalOpen(true)}
                  className="text-h5 bg-purple hover:bg-deep-purple cursor-pointer rounded-md py-3 font-bold text-white transition-colors md:py-4"
                >
                  입찰
                </button>
              </div>

              {/* 찜 */}
              <button
                onClick={handleLikeClick}
                className="hover:bg-g500/50 flex-shrink-0 rounded-full p-2 transition-colors"
                aria-label="찜"
              >
                <Heart
                  className={`h-7 w-7 md:h-8 md:w-8 ${isLiked ? "fill-purple text-purple" : "text-g300"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 입찰 모달 */}
      <BidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        currentPrice={currentPrice}
        minBidPrice={minBidUnit}
        productTitle={title}
        onBidSubmit={handleBidSubmit}
      />

      {/* 토스트 알림 */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default ProductInfo;
