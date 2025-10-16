// todo 찜..
import React, { useMemo, useState, type KeyboardEvent } from "react";
import { Heart } from "lucide-react";
import type { AuctionItem } from "../types/auctions";
import { buildImageUrl } from "../../../shared/utils/imageUrl";

interface ProductCardProps {
  item: AuctionItem;
  liked?: boolean;
  onCardClick?: (id: number) => void;
  onLikeToggle?: (id: number, liked: boolean) => void;
}

const STATUS_STYLE: Record<AuctionItem["sellingStatus"], string> = {
  시작전: "bg-purple text-white",
  진행중: "bg-purple text-white",
  완료: "bg-g300 text-white",
  종료: "bg-g300 text-white",
};

const ProductCard = React.memo(function ProductCard({
  item,
  liked = false,
  onCardClick,
  onLikeToggle,
}: ProductCardProps) {
  const {
    auctionId,
    title,
    currentPrice,
    mainImageUrl,
    sellingStatus,
    sellerNickname,
    wishCount,
  } = item;

  const [imgError, setImgError] = useState(false);
  const src = useMemo(
    () =>
      mainImageUrl ? (buildImageUrl(mainImageUrl) ?? undefined) : undefined,
    [mainImageUrl]
  );

  const status = sellingStatus;
  const badgeClass = STATUS_STYLE[status] ?? "bg-purple text-white";

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onCardClick?.(auctionId);
    }
  };

  return (
    <div
      className="cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      onClick={() => onCardClick?.(auctionId)}
      onKeyDown={onKey}
      aria-label={`${title} 카드`}
    >
      {/* 이미지 */}
      <div className="relative">
        {src && !imgError ? (
          <img
            src={src}
            alt={title}
            className="aspect-square w-full rounded-2xl object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="bg-g400 text-g300 flex aspect-square w-full items-center justify-center rounded-2xl">
            이미지 없음
          </div>
        )}

        {/* 상태 배지 */}
        <div
          className={`absolute top-2 right-2 rounded px-2 py-1 text-xs ${badgeClass}`}
          aria-label={`판매 상태: ${status}`}
        >
          {status}
        </div>
      </div>

      {/* 정보 */}
      <div className="mt-2">
        <h3 className="text-g100 mb-1 line-clamp-2 text-sm font-medium">
          {title}
        </h3>
        <p className="text-g100 mb-2 text-base font-bold">
          현재 {currentPrice.toLocaleString()}원
        </p>
        <div className="flex items-center justify-between">
          <span className="text-g300 text-xs">{sellerNickname}</span>

          <button
            type="button"
            className="hover:bg-g500/40 flex items-center gap-1 rounded-full p-1 transition-colors"
            aria-pressed={liked}
            aria-label={liked ? "찜 취소" : "찜"}
            onClick={(e) => {
              e.stopPropagation();
              onLikeToggle?.(auctionId, !liked);
            }}
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-red text-red" : "text-g300"}`}
            />
            <span className="text-g300 text-xs">{wishCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
