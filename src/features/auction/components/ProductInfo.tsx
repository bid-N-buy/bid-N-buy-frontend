// todo 반응형 개선
import { EllipsisVertical, Heart } from "lucide-react";
import React, { useState } from "react";

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
  onBidClick?: () => void;
  onShareClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
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
  onBidClick,
  onShareClick,
  onEditClick,
  onDeleteClick,
}) => {
  const [isLiked, setIsLiked] = useState(liked);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLikeClick = () => {
    setIsLiked((prev) => !prev);
    onLikeToggle?.();
  };

  return (
    <div className="aspect-[645/500] w-full">
      <div className="flex h-full flex-col justify-between gap-[30px] px-[10px] py-[20px]">
        {/* Top - 카테고리, 제목 */}
        <div className="relative flex flex-[2] flex-col gap-3">
          <div className="text-g300 text-h5">
            {categoryMain} &gt; {categorySub}
          </div>

          <h3 className="text-g100 text-h2 pr-12 leading-tight font-bold">
            {title}
          </h3>

          {/* 더보기? 아이콘 */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-g500/50 rounded-full p-2 transition-colors"
              aria-label="더보기"
            >
              <EllipsisVertical className="text-g200 h-8 w-8" />
            </button>

            {isMenuOpen && (
              <div className="border-g400 absolute top-full right-0 z-10 mt-2 w-32 rounded border bg-white shadow-lg">
                <button
                  onClick={() => {
                    onShareClick?.();
                    setIsMenuOpen(false);
                  }}
                  className="text-g100 hover:bg-g500 w-full px-4 py-3 text-left text-base transition-colors"
                >
                  공유
                </button>
                {isSeller && (
                  <>
                    <button
                      onClick={() => {
                        onEditClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="border-g400 text-g100 hover:bg-g500 w-full border-t px-4 py-3 text-left text-base transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        onDeleteClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="border-g400 text-red hover:bg-g500 w-full border-t px-4 py-3 text-left text-base transition-colors"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Middle - 판매자 정보 */}
        <div className="flex flex-[1] items-center gap-5">
          <div className="bg-g500 h-20 w-20 flex-shrink-0 overflow-hidden rounded-full">
            {sellerProfileImage ? (
              <img
                src={sellerProfileImage}
                alt={sellerNickname}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-g100 text-h4 font-medium">
              {sellerNickname}
            </span>
            <span className="text-g300 text-h5">{sellerTemperature}°C</span>
          </div>
        </div>

        {/* Bottom - 가격, 버튼 등 */}
        <div className="flex flex-[3] flex-col justify-end gap-[33px]">
          <div className="flex items-baseline gap-3">
            <span className="text-g100 text-h2 leading-tight font-bold">
              현재
            </span>
            <span className="text-g100 text-h2 leading-tight font-bold">
              {currentPrice.toLocaleString()}원
            </span>
            <span className="text-g300 text-h5">
              (최소 입찰 단위 : {minBidUnit.toLocaleString()}원)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="grid flex-1 grid-cols-2 gap-3">
              <button
                onClick={onChatClick}
                className="text-h5 border-purple text-purple hover:bg-light-purple rounded-md border py-4 font-bold transition-colors"
              >
                판매자와 대화
              </button>
              <button
                onClick={onBidClick}
                className="text-h5 bg-purple hover:bg-deep-purple rounded-md py-4 font-bold text-white transition-colors"
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
                className={`h-8 w-8 ${isLiked ? "fill-purple text-purple" : "text-g300"}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
