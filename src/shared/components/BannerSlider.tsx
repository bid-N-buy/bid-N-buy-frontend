import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BannerItem = {
  src: string;
  to: string;
  alt?: string;
};

interface BannerSliderProps {
  items: BannerItem[];
  intervalMs?: number; // 자동 슬라이드 간격
  className?: string; // 필요 시 외부에서 추가 스타일
}

const BannerSlider = ({
  items,
  intervalMs = 4000,
  className = "",
}: BannerSliderProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const count = items.length;
  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count); // 음수도 래핑
    },
    [count]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // reduced motion 지원 (자동재생x)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || paused || count <= 1) return;

    const id = setInterval(next, intervalMs);
    return () => clearInterval(id);
  }, [next, paused, intervalMs, count]);

  useEffect(() => {
    const onVisibility = () => {
      setPaused(document.visibilityState === "hidden"); // 탭 비활성화 시 일시정지
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // 키보드 방향키 이동 (배너에 포커스 있을 때)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // 터치 스와이프 (모바일)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    if (startX == null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    // 임계값(50px) 이상이면 스와이프 처리
    if (deltaX > 50) prev();
    else if (deltaX < -50) next();
    touchStartX.current = null;
  };

  if (count === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="메인 배너"
      onMouseEnter={() => setPaused(true)} // 마우시 호버 시 일시정지
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0} // 포커스 가능
    >
      {/* 슬라이드 목록 */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {items.map((item, i) => (
          <Link
            key={i}
            to={item.to}
            className="block aspect-[1320/500] w-full shrink-0"
            aria-label={item.alt ?? "배너"}
            aria-current={i === index ? "true" : "false"}
          >
            <img
              src={item.src}
              alt={item.alt ?? "배너"}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </Link>
        ))}
      </div>

      {/* 좌우 버튼 */}
      <button
        type="button"
        onClick={prev}
        className="absolute top-1/2 left-4 -translate-y-1/2 text-white/50 drop-shadow-lg transition-all hover:scale-110 hover:text-white focus:outline-none"
        aria-label="이전 배너"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute top-1/2 right-4 -translate-y-1/2 text-white/50 drop-shadow-lg transition-all hover:scale-110 hover:text-white focus:outline-none"
        aria-label="다음 배너"
      >
        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
      </button>

      {/* 인디케이터(점) */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번째 배너로 이동`}
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

export default BannerSlider;
