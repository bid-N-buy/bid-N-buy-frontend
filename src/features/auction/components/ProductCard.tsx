import React from "react";
import { Heart } from "lucide-react";
import type { ProductCardProps } from "../types/product";

const ProductCard: React.FC<ProductCardProps> = ({
  auctionId,
  title,
  currentPrice,
  mainImageUrl,
  sellingStatus,
  nickname,
  liked = false,
  likeCount = 0,
  chatCount = 0,
  onCardClick,
  onLikeToggle,
}) => {
  // 판매상태별..
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "진행 중":
      case "진행중":
        return "bg-purple";
      case "종료":
        return "bg-g300";
      case "판매완료":
        return "bg-red";
      default:
        return "bg-purple";
    }
  };

  return (
    <div
      className="flex cursor-pointer flex-col"
      onClick={() => onCardClick?.(auctionId)}
    >
      {/* 이미지 */}
      <div className="relative mb-3">
        {mainImageUrl ? (
          <img
            src={mainImageUrl}
            alt={title}
            className="bg-g500 aspect-square w-full object-cover"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = "flex";
              }
            }}
          />
        ) : null}
        <div
          className="bg-g500 flex aspect-square items-center justify-center"
          style={{ display: mainImageUrl ? "none" : "flex" }}
        >
          <span className="text-g300 text-[15px]">이미지</span>
        </div>

        {/* 상태 */}
        <div
          className={`${getStatusColor(sellingStatus)} absolute top-2 left-2 rounded-full px-3 py-1`}
        >
          <span className="text-[11px] font-medium text-white">
            {sellingStatus}
          </span>
        </div>
      </div>

      {/* 정보 */}
      <div className="flex flex-col gap-1">
        {/* 상품명 */}
        <h6 className="text-g100 truncate font-medium">{title}</h6>

        {/* 현재가 */}
        <div className="text-g100 text-[15px] font-bold">
          현재 {currentPrice.toLocaleString()}원
        </div>

        {/* 판매자, 하트 */}
        {nickname && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-g100 text-[13px]">{nickname}</span>
            <button
              className="p-0.5 transition-transform hover:scale-110"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onLikeToggle?.(auctionId, !liked);
              }}
            >
              <Heart
                className={`h-4 w-4 ${liked ? "fill-purple text-purple" : "text-g300"}`}
              />
            </button>
          </div>
        )}

        {/* 찜/채팅 count */}
        {(nickname || likeCount > 0 || chatCount > 0) && (
          <div className="text-g300 flex items-center gap-3 text-[11px]">
            <span>찜 {likeCount}</span>
            <span>채팅 {chatCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
