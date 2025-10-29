// src/features/mypage/components/items/TradeRowCompact.tsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import type { TradeItem } from "../../types/trade";

type Props = {
  item: TradeItem;
  wishStyle?: boolean;
  onToggleLike?: (auctionId: number, nextLiked: boolean) => void;
  rightText?: React.ReactNode;
  onClick?: (id: string | number) => void;
  subtitleTop?: string;
  subtitleBottom?: string;
  className?: string;

  // 구매 확정 (별점 → 정산) 버튼 노출 여부
  canConfirm?: boolean;

  // 구매 확정 버튼 눌렀을 때 부모에서 처리 (모달 오픈 등)
  onConfirmClick?: (orderId: number | string) => void;

  // 이 아이템만 로딩 중인지 여부
  confirming?: boolean;
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
  canConfirm = false,
  onConfirmClick,
  confirming = false,
}) => {
  const nav = useNavigate();

  // 서버에서 내려온 필드들
  const {
    id,
    title,
    thumbUrl,
    statusText,
    counterparty,
    auctionEnd,
    price,
    finalPrice,
    currentPrice,
    winningPrice,
  } = item as any;

  // 구매확정/정산 API 호출 때 사용할 식별자
  const orderId = (item as any).orderId ?? item.id;

  // row 전체 클릭 시
  const handleRowClick = () => {
    if (id == null) return;
    if (onClick) {
      onClick(id);
    } else {
      nav(`/auctions/${id}`);
    }
  };

  // 왼쪽 본문 보조 텍스트
  const topText =
    subtitleTop ?? (counterparty ? `판매자: ${counterparty}` : "");
  const bottomText =
    subtitleBottom ?? (auctionEnd ? `마감: ${fmtDateTime(auctionEnd)}` : "");

  // 우측 상태 텍스트 기본
  const fallbackRightNode = rightText ?? statusText ?? "";

  // 💰 가격 계산
  const numericPrice: number | undefined =
    typeof price === "number"
      ? price
      : typeof finalPrice === "number"
        ? finalPrice
        : typeof currentPrice === "number"
          ? currentPrice
          : typeof winningPrice === "number"
            ? winningPrice
            : undefined;

  const priceStr = useMemo(() => {
    if (typeof numericPrice === "number") {
      return numericPrice.toLocaleString("ko-KR") + "원";
    }
    return undefined;
  }, [numericPrice]);

  // 찜 화면일 때는 우측 하트 모드
  const liked = true;

  // 구매 확정 버튼 text (상태에 따라 조금 느낌 다르게)
  const confirmLabel = useMemo(() => {
    const txt = String(statusText || "");
    if (txt.includes("정산")) return "거래 완료하기";
    if (txt.includes("결제")) return "수령 완료";
    return "구매 확정";
  }, [statusText]);

  // 구매 확정 버튼 클릭
  const handleConfirmClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 행 전체 클릭 방지
    if (confirming) return;
    onConfirmClick?.(orderId);
  };

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

          {/* 찜 모드가 아닐 때만 가격 노출 */}
          {priceStr && !wishStyle && (
            <p className="mt-1 text-sm text-neutral-700">{priceStr}</p>
          )}
        </div>

        {/* 우측 영역 */}
        <div
          className="shrink-0 pl-2 text-right text-sm text-neutral-700"
          onClick={(e) => e.stopPropagation()} // 우측 클릭은 row 클릭 막음
        >
          {wishStyle ? (
            <>
              {/* 찜/하트 영역 */}
              <button
                type="button"
                aria-label={liked ? "찜 해제" : "찜 하기"}
                aria-pressed={liked}
                className="mb-2 inline-flex items-center justify-center rounded-full p-1 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                onClick={() => {
                  if (id == null) return;
                  onToggleLike?.(Number(id), !liked);
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
          ) : canConfirm ? (
            // 구매 확정 버튼
            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={confirming}
              className={`rounded-[6px] border px-2 py-1 text-xs font-semibold ${
                confirming
                  ? "cursor-not-allowed border-neutral-300 bg-neutral-100 text-neutral-400"
                  : "border-purple-600 text-purple-600 hover:bg-purple-50"
              }`}
            >
              {confirming ? "처리 중..." : confirmLabel}
            </button>
          ) : (
            // 그냥 상태 텍스트
            <div className="text-sm text-neutral-700">{fallbackRightNode}</div>
          )}
        </div>
      </div>

      {/* row 하단 구분선 */}
      <div className="h-px w-full bg-neutral-200" />
    </li>
  );
};

export default TradeRowCompact;
