// src/features/mypage/components/items/TradeRowCompact.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import type { TradeItem } from "../../types/trade";

type Props = {
  item: TradeItem;
  wishStyle?: boolean; // 찜 화면이면 true → 오른쪽에 하트 + 현재가
  onToggleLike?: (auctionId: number, nextLiked: boolean) => void;
  rightText?: React.ReactNode; // 구매/판매 내역 등에서 오른쪽에 표시할 상태 텍스트 override
  onClick?: (id: string) => void;
  subtitleTop?: string;
  subtitleBottom?: string;
  className?: string;
};

function fmtDateTime(iso?: string) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(
    d.getHours()
  )}:${p2(d.getMinutes())}`;
}

const TradeRowCompact: React.FC<Props> = ({
  item,
  wishStyle = false,
  onToggleLike,
  rightText,
  onClick,
  subtitleTop,
  subtitleBottom,
  className,
}) => {
  const nav = useNavigate();

  const { id, title, thumbUrl, price, statusText, counterparty, auctionEnd } =
    item;

  // 전체 row 클릭 시
  const handleRowClick = () => {
    if (!id) return;
    if (onClick) onClick(id);
    else nav(`/auctions/${id}`);
  };

  // 왼쪽 본문 보조 텍스트
  const topText =
    subtitleTop ?? (counterparty ? `판매자: ${counterparty}` : "");

  const bottomText =
    subtitleBottom ?? (auctionEnd ? `마감: ${fmtDateTime(auctionEnd)}` : "");

  // 기본 모드에서 오른쪽에 뿌릴 내용
  const fallbackRightNode = rightText ?? statusText ?? "";

  // 가격 문자열
  const priceStr = useMemo(
    () =>
      typeof price === "number"
        ? price.toLocaleString("ko-KR") + "원"
        : undefined,
    [price]
  );

  // 찜 목록에서는 어차피 '찜한 상태'라 하트는 기본적으로 보라색 채움 상태로 노출하는 게 UX적으로 자연스럽다.
  // 아직 서버 liked 값이 없으니 liked = true 가정.
  const liked = true;

  return (
    <li
      className={`cursor-pointer select-none ${className ?? ""}`.trim()}
      onClick={handleRowClick}
      role="button"
      aria-label={title || "경매 항목"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
    >
      <div className="flex items-start gap-4 py-4">
        {/* 썸네일 */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-200">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                // 개발 중 디버깅용
                // console.error("❌ 이미지 로드 실패:", thumbUrl, item);

                const el = e.currentTarget as HTMLImageElement;
                el.src = "https://via.placeholder.com/64x64.png?text=%3F";
                el.style.objectFit = "cover";
                el.style.background = "#eee";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-300 text-[10px] text-neutral-600">
              noimg
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-neutral-900">
            {title}
          </p>

          {topText && (
            <p className="mt-1 text-sm text-neutral-600">{topText}</p>
          )}

          {bottomText && (
            <p className="text-sm text-neutral-600">{bottomText}</p>
          )}

          {/* 찜 모드가 아닐 때만 본문에도 가격 노출 */}
          {priceStr && !wishStyle && (
            <p className="mt-1 text-sm text-neutral-700">{priceStr}</p>
          )}
        </div>

        {/* 우측 영역 */}
        <div
          className="shrink-0 pl-2 text-right text-sm text-neutral-700"
          onClick={(e) => e.stopPropagation()} // 우측 눌러도 row 클릭 안 타게
        >
          {wishStyle ? (
            <>
              {/* 하트 버튼 */}
              <button
                type="button"
                aria-label={liked ? "찜 해제" : "찜 하기"}
                aria-pressed={liked}
                className="mb-2 inline-flex items-center justify-center rounded-full p-1 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                onClick={() => {
                  if (!id) return;
                  onToggleLike?.(Number(id), !liked); // liked가 true니까 -> false로 토글 요청
                }}
              >
                <Heart
                  size={22}
                  className={
                    liked
                      ? "text-purple [fill:currentColor]"
                      : "hover:text-purple text-neutral-400 transition-colors"
                  }
                  aria-hidden="true"
                />
              </button>

              <div className="text-xs text-neutral-500">현재가</div>
              <div className="text-[15px] font-semibold text-neutral-900">
                {priceStr ?? "0원"}
              </div>
            </>
          ) : (
            <div>{fallbackRightNode}</div>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
};

export default TradeRowCompact;
