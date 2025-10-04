import { EllipsisVertical, Heart } from "lucide-react";
import React from "react";

const ProductInfo = () => {
  return (
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
  );
};

export default ProductInfo;
