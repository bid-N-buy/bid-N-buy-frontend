// todo 컴포넌트 분리 등
import React, { useState, useCallback } from "react";
import BidModal from "./BidModal";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import api from "../../../shared/api/axiosInstance";
import { EllipsisVertical, Heart } from "lucide-react";
import { formatDate } from "../../../shared/utils/datetime";
import { buildImageUrl } from "../../../shared/utils/imageUrl";
import { useChatRoomAuc } from "../../chatting/api/useChatRoom";

export interface ProductInfoProps {
  auctionId: number; // 채팅방 생성 시 필요 -> 필수로 수정, number로 수정
  sellerId: number; // 채팅방 생성 시 필요 -> 필수로 수정, number로 수정
  title?: string;
  categoryMain?: string;
  categorySub?: string;
  currentPrice?: number;
  minBidPrice?: number;
  bidCount?: number;
  startTime?: string;
  endTime?: string;
  sellerNickname?: string;
  sellerProfileImageUrl?: string | null;
  sellerTemperature?: number;
  sellingStatus?: string;
  wishCount?: number;

  isSeller?: boolean;
  liked?: boolean;
  onLikeToggle?: () => void;
  onShareClick?: () => void;
  onDeleteClick?: () => void;
}

const ProductInfo = ({
  auctionId,
  sellerId,
  title,
  categoryMain,
  categorySub,
  currentPrice,
  minBidPrice,
  bidCount,
  startTime,
  endTime,
  sellerNickname,
  sellerProfileImageUrl,
  sellerTemperature,
  sellingStatus,
  wishCount,

  isSeller = false,
  liked = false,
  onLikeToggle,
  onShareClick,
  onDeleteClick,
}: ProductInfoProps) => {
  const [isLiked, setIsLiked] = useState(liked);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const userId = useAuthStore.getState().userId;
  const { loadChatRoom } = useChatRoomAuc(sellerId, auctionId);

  const handleLikeClick = useCallback(() => {
    setIsLiked((prev) => !prev);
    onLikeToggle?.();
  }, [onLikeToggle]);

  const handleBidSubmit = useCallback(
    (bidPrice: number) => {
      if (bidPrice === 0) {
        showToast("입찰 가능 금액 이상 입력해 주세요.", "error");
        return;
      }
      // todo 입찰 api 연동
      showToast("정상적으로 입찰되었습니다.", "success");
      setIsBidModalOpen(false);
    },
    [showToast]
  );

  // 채팅방 생성
  const handleChatAdd = async (auctionId: number, sellerId: number) => {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      showToast("로그인이 필요합니다.", "error");
      return;
    }

    try {
      const response = await api.post(
        `/chatrooms/${auctionId}`,
        { sellerId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const chatroomId = response.data.chatroomId;
      await loadChatRoom();
      // 채팅 모달이 헤더에 종속된 컴포넌트이므로 zustand로 상태 변경
      useChatModalStore.getState().openChatRoom(chatroomId);
    } catch (error) {
      showToast("채팅방 생성에 실패했습니다.", "error");
      console.error("Chat creation failed:", error);
    }
  };

  return (
    <>
      <div className="w-full lg:aspect-[645/500]">
        <div className="flex h-full flex-col justify-between gap-5 px-1.5 py-3 sm:gap-4 sm:px-2 sm:py-4 md:gap-4.5 md:px-2.5 md:py-5 lg:gap-5">
          {/* 1-2. 카테고리 ~ 제목 */}
          <div className="flex flex-col gap-1.5 sm:gap-1.5 md:gap-2 lg:gap-3.5">
            {/* 1. 카테고리 + 더보기 */}
            <div className="relative">
              {(categoryMain || categorySub) && (
                <div className="text-g300 text-h7 md:text-h6 sm:text-base">
                  {categoryMain ?? "카테고리"}
                  {categorySub ? ` > ${categorySub}` : ""}
                </div>
              )}

              {/* 더보기? 아이콘 - todo 분리 */}
              <div className="absolute top-0 right-0">
                <button
                  onClick={() => setIsMenuOpen((v) => !v)}
                  className="hover:bg-g500/50 rounded-full p-1.5 transition-colors sm:p-2"
                  aria-label="더보기"
                >
                  <EllipsisVertical className="text-g200 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                </button>

                {isMenuOpen && (
                  <div className="border-g400 absolute top-full right-0 z-10 mt-2 w-18 rounded-md border bg-white shadow-lg">
                    <button
                      onClick={() => {
                        onShareClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="text-g100 hover:bg-g500 w-full px-4 py-2.5 text-center text-base transition-colors md:py-3"
                    >
                      공유
                    </button>
                    {isSeller && (
                      <button
                        onClick={() => {
                          onDeleteClick?.();
                          setIsMenuOpen(false);
                        }}
                        className="border-g400 text-red hover:bg-g500 w-full border-t px-4 py-2.5 text-left text-base transition-colors md:py-3"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. 제목 */}
            {title && (
              <div>
                <span className="text-g100 text-h4 sm:text-h4 md:text-h3 lg:text-h2 max-w-full truncate pr-10 font-bold md:pr-12">
                  {title}
                </span>
              </div>
            )}
          </div>

          {/* 3. 판매자 정보 - todo 분리 */}
          {(sellerNickname || sellerProfileImageUrl) && (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="bg-g500 h-11 w-11 flex-shrink-0 overflow-hidden rounded-full sm:h-12 sm:w-12 md:h-13 md:w-13 lg:h-17 lg:w-17">
                {sellerProfileImageUrl ? (
                  <img
                    src={buildImageUrl(sellerProfileImageUrl) ?? undefined}
                    alt={sellerNickname ?? "판매자"}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                {sellerNickname && (
                  <span className="text-g100 text-h7 md:text-h6 lg:text-h5 max-w-[50vw] truncate font-medium sm:text-base md:max-w-none">
                    {sellerNickname}
                  </span>
                )}
                {typeof sellerTemperature === "number" && (
                  <span className="text-g300 text-h8 sm:text-h7 lg:text-h6 whitespace-nowrap md:text-base">
                    {sellerTemperature}°C
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 4. 가격 + 최소 입찰 단위 */}
          {(typeof currentPrice === "number" ||
            typeof minBidPrice === "number") && (
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2.5">
              {typeof currentPrice === "number" && (
                <span className="text-g100 text-h4 sm:text-h4 md:text-h3 lg:text-h2 font-bold">
                  현재 {currentPrice.toLocaleString()}원
                </span>
              )}
              {typeof minBidPrice === "number" && (
                <span className="text-g300 text-h7 md:text-h6 whitespace-nowrap sm:text-base">
                  (최소 입찰 단위 : {minBidPrice.toLocaleString()}원)
                </span>
              )}
            </div>
          )}

          {/* 5-6. 버튼들 ~ 기타 */}
          <div className="flex flex-col justify-end gap-1 sm:gap-1.5 md:gap-2 lg:gap-3.5">
            {/* 5. 버튼들 + 찜 */}
            <div className="flex items-stretch gap-2 md:gap-1.5">
              <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 md:gap-2.5">
                {sellerId !== userId && (
                  <button
                    onClick={() => handleChatAdd(auctionId, sellerId)}
                    className="text-h7 md:text-h6 lg:text-h5 border-purple text-purple hover:bg-light-purple cursor-pointer rounded-md border py-2 font-bold transition-colors sm:py-3 sm:text-base md:py-4"
                  >
                    판매자와 대화
                  </button>
                )}
                <button
                  onClick={() => setIsBidModalOpen(true)}
                  className={`text-h7 md:text-h6 lg:text-h5 bg-purple hover:bg-deep-purple cursor-pointer rounded-md py-2 font-bold text-white transition-colors sm:py-3 sm:text-base md:py-4 ${
                    sellerId !== userId && `w-full`
                  }`}
                  disabled={
                    typeof currentPrice !== "number" ||
                    typeof minBidPrice !== "number"
                  }
                >
                  입찰
                </button>
              </div>

              {/* 찜 */}
              <button
                onClick={handleLikeClick}
                className="group flex-shrink-0 rounded-full p-1.5 transition-colors focus:outline-none sm:p-2"
                aria-label="찜"
              >
                <Heart
                  className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${isLiked ? "fill-purple text-purple" : "text-g300 group-hover:text-purple"}`}
                />
              </button>
            </div>

            {/* 6. 기간 + 입찰 횟수 */}
            {(startTime || endTime || typeof bidCount === "number") && (
              <div className="bg-g500/50 text-h7 md:text-h6 flex items-center gap-2 rounded-md px-2 py-1.5 sm:gap-3 sm:px-3 sm:py-2 sm:text-base">
                {(startTime || endTime) && (
                  <span className="text-g300">
                    기간{" "}
                    <span className="text-g200">
                      {startTime ? formatDate(startTime) : "?"} -{" "}
                      {endTime ? formatDate(endTime) : "?"}
                    </span>
                  </span>
                )}
                {(startTime || endTime) && typeof bidCount === "number" && (
                  <span className="text-g300">|</span>
                )}
                {typeof bidCount === "number" && (
                  <span className="text-g200">
                    입찰{" "}
                    <span className="text-purple font-bold">{bidCount}</span>회
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 입찰 모달 */}
      <BidModal
        isOpen={isBidModalOpen}
        onClose={() => setIsBidModalOpen(false)}
        currentPrice={currentPrice ?? 0}
        minBidPrice={minBidPrice ?? 0}
        productTitle={title ?? ""}
        onBidSubmit={handleBidSubmit}
      />

      {/* 토스트 알림 */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default ProductInfo;
