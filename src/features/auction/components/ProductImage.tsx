import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AuctionImage } from "../types/auctions";
import { buildImageUrl } from "../../../shared/utils/imageUrl";

interface ProductImageProps {
  images?: AuctionImage[];
  imageUrls?: string[];
  mainImageUrl?: string;
}

const ProductImage = ({
  images,
  imageUrls,
  mainImageUrl,
}: ProductImageProps) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  // 이미지url 배열 생성
  const imageList = useMemo(() => {
    // images 배열에서 추출
    if (images && images.length > 0) {
      return images
        .map((img) => buildImageUrl(img.imageUrl))
        .filter((url): url is string => url != null);
    }
    // imageUrls 배열 사용
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls
        .map((url) => buildImageUrl(url))
        .filter((url): url is string => url != null);
    }
    // mainImageUrl 단일 이미지
    if (mainImageUrl) {
      const url = buildImageUrl(mainImageUrl);
      return url ? [url] : [];
    }
    return [];
  }, [images, imageUrls, mainImageUrl]);

  const count = imageList.length;

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // 키보드 방향키 지원
  useEffect(() => {
    if (count <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, count]);

  // 터치 스와이프
  const onTouchStart = (e: React.TouchEvent) => {
    if (count <= 1) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (count <= 1) return;
    const startX = touchStartX.current;
    if (startX == null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (deltaX > 50) prev();
    else if (deltaX < -50) next();
    touchStartX.current = null;
  };

  // 이미지 없는 경우.. 없을리 없지만
  if (count === 0) {
    return (
      <div
        aria-label="이미지 없음"
        className="bg-g400 aspect-[645/500] w-full rounded-3xl"
      />
    );
  }

  // 이미지 1장 - 슬라이드x
  if (count === 1) {
    return (
      <div
        aria-label="상품 이미지"
        className="relative aspect-[645/500] w-full overflow-hidden rounded-3xl"
      >
        {/* 배경 */}
        <img
          src={imageList[0]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30 blur-3xl brightness-110"
          aria-hidden="true"
        />
        {/* 이미지 */}
        <img
          src={imageList[0]}
          alt="상품 이미지"
          className="relative h-full w-full object-contain"
        />
      </div>
    );
  }

  // 이미지 여러 장 - 슬라이드
  return (
    <div
      ref={containerRef}
      className="relative aspect-[645/500] w-full overflow-hidden rounded-3xl"
      role="region"
      aria-roledescription="image carousel"
      aria-label="상품 이미지"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
    >
      {/* 슬라이드 */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {imageList.map((src, i) => (
          <div
            key={i}
            className="relative h-full w-full shrink-0"
            aria-current={i === index ? "true" : "false"}
          >
            {/* 배경 */}
            <img
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30 blur-3xl brightness-110"
              draggable={false}
              aria-hidden="true"
            />
            {/* 이미지 */}
            <img
              src={src}
              alt={`상품 이미지 ${i + 1}`}
              className="relative h-full w-full object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* 좌우 버튼 */}
      <button
        type="button"
        onClick={prev}
        className="absolute top-1/2 left-4 -translate-y-1/2 text-white/50 drop-shadow-lg transition-all hover:scale-110 hover:text-white focus:outline-none"
        aria-label="이전 이미지"
      >
        <ChevronLeft className="h-9 w-9" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 drop-shadow-lg transition-all hover:scale-110 hover:text-white focus:outline-none"
        aria-label="다음 이미지"
      >
        <ChevronRight className="h-9 w-9" strokeWidth={2.5} />
      </button>

      {/* 인디케이터(점) */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {imageList.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번째 이미지로 이동`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductImage;
