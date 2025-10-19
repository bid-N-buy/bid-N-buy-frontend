import { Heart } from "lucide-react";
import { useWish } from "../hooks/useWish";
import type { WishState } from "../types/wish";

interface WishButtonProps {
  auctionId: number;
  initial?: WishState;
  size?: "sm" | "md" | "lg";
}

const WishButton = ({ auctionId, initial, size = "md" }: WishButtonProps) => {
  const { liked, wishCount, loading, toggle } = useWish({ auctionId, initial });

  // 사이즈별
  const config = {
    sm: { icon: 20, text: "text-xs", wrap: "min-w-10 p-1 gap-0.5" },
    md: { icon: 26, text: "text-sm", wrap: "min-w-12 p-1.5 gap-1" },
    lg: { icon: 32, text: "text-base", wrap: "min-w-14 p-2 gap-1.5" },
  }[size];

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "찜 취소" : "찜하기"}
      aria-busy={loading}
      disabled={loading}
      onClick={toggle}
      className={`group inline-flex flex-col items-center justify-center ${config.wrap} hover:bg-g500/40 focus-visible:ring-purple rounded-2xl transition focus:outline-none focus-visible:ring-2 disabled:opacity-60`}
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
