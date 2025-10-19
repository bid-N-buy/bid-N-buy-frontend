// todo 백 작업 완료 시 liked 다시 확인
import React, { useMemo, useState, type KeyboardEvent } from "react";
import type { AuctionItem } from "../types/auctions";
import { buildImageUrl } from "../../../shared/utils/imageUrl";
import WishButton from "../../wish/components/WishButton";

interface ProductCardProps {
  item: AuctionItem;
  onCardClick?: (id: number) => void;
}

const STATUS_STYLE: Record<AuctionItem["sellingStatus"], string> = {
  시작전: "bg-purple text-white",
  진행중: "bg-purple text-white",
  완료: "bg-g300 text-white",
  종료: "bg-g300 text-white",
};

const ProductCard = React.memo(function ProductCard({
  item,
  onCardClick,
}: ProductCardProps) {
  const {
    auctionId,
    title,
    currentPrice,
    mainImageUrl,
    sellingStatus,
    sellerNickname,
    wishCount,
    liked = false,
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
        <p className="text-g100 text-base font-bold">
          현재 {currentPrice.toLocaleString()}원
        </p>
        <div className="flex items-end justify-between">
          <span className="text-g300 text-base">{sellerNickname}</span>
          {/* 찜 버튼 - 카드 클릭과 이벤트 충돌 방지 stopPropagation */}
          <div onClick={(e) => e.stopPropagation()}>
            <WishButton
              auctionId={auctionId}
              initial={{
                liked,
                wishCount: wishCount ?? 0,
              }}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
