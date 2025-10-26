import { Heart } from "lucide-react";
import { useWish } from "../hooks/useWish";
import type { WishState } from "../types/wish";

interface WishButtonProps {
  auctionId: number;
  initial?: WishState;
  sellerId?: number;
  size?: "sm" | "lg";
}

const WishButton = ({
  auctionId,
  initial,
  sellerId,
  size = "sm",
}: WishButtonProps) => {
  const { liked, wishCount, loading, toggle } = useWish({
    auctionId,
    initial,
    sellerId,
  });

  // 사이즈별
  const config = {
    sm: { icon: 22, text: "text-xs", wrap: "min-w-10 p-0.5 gap-0.5" },
    lg: { icon: 35, text: "text-base", wrap: "min-w-14 p-0.5 gap-1" },
  }[size];

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "찜 취소" : "찜하기"}
      aria-busy={loading}
      disabled={loading}
      onClick={toggle}
      className={`group inline-flex flex-col items-center justify-center ${config.wrap} focus-visible:ring-purple rounded-2xl transition focus:outline-none focus-visible:ring-2 disabled:opacity-60`}
    >
      <Heart
        size={config.icon}
        className={
          liked
            ? "text-purple fill-current"
            : "text-g300 group-hover:text-purple"
        }
        aria-hidden="true"
      />
      <span className={`text-g300 ${config.text}`}>{wishCount}</span>
    </button>
  );
};

export default WishButton;
