import React, { useState, useCallback, useRef, useEffect } from "react";
import BidModal from "./BidModal";
import { useAuthStore } from "../../auth/store/authStore";
import { useChatModalStore } from "../../../shared/store/ChatModalStore";
import Toast from "../../../shared/components/Toast";
import useToast from "../../../shared/hooks/useToast";
import api from "../../../shared/api/axiosInstance";
import { EllipsisVertical } from "lucide-react";
import { formatDate } from "../../../shared/utils/datetime";
import { buildImageUrl } from "../../../shared/utils/imageUrl";
import { useChatRoomAuc } from "../../chatting/api/useChatRoom";
import { useBid } from "../hooks/useBid";
import WishButton from "../../wish/components/WishButton";
import { deleteAuction } from "../api/auctions";
import { useAdminAuthStore } from "../../admin/store/adminStore";
import { adminDeleteAuction } from "../../admin/api/admin";
import { Link } from "react-router-dom";

export interface ProductInfoProps {
  auctionId: number;
  sellerId: number;
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
  liked?: boolean;

  isSeller?: boolean;
  onDeleteClick?: () => void;

  onAfterBid?: (next: { currentPrice?: number }) => void;

  showToast?: (msg: string, type?: "success" | "error") => void;
  hideToast?: () => void;
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
  liked = false,
  isSeller = false,
  onDeleteClick,
  onAfterBid,
  showToast: propShowToast, // 👈 프롭스 showToast의 이름을 변경
  hideToast: propHideToast, // 👈 프롭스 hideToast의 이름을 변경
}: ProductInfoProps) => {
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const userId = useAuthStore((s) => s.userId);
  const token = useAuthStore((s) => s.accessToken);

  const adminToken = useAdminAuthStore((s) => s.accessToken);

  const { loadChatRoom } = useChatRoomAuc(sellerId, auctionId);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [isMenuOpen]);

  // 공유
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          url: window.location.href,
        });
        showToast("링크를 공유합니다.", "success");
      } else {
        // Web Share API 미지원 시 링크 복사
        await navigator.clipboard.writeText(window.location.href);
        showToast("링크가 복사되었습니다.", "success");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        showToast("공유에 실패했습니다.", "error");
      }
    } finally {
      setIsMenuOpen(false);
    }
  };

  // 삭제
  const handleDeleteAuction = useCallback(async () => {
    if (!isSeller && !adminToken) return;
    const ok = window.confirm("경매를 삭제하시겠습니까?");
    if (!ok) return;

    try {
      if (isSeller) await deleteAuction(auctionId);
      if (adminToken) await adminDeleteAuction(auctionId);
      showToast("경매가 삭제되었습니다.", "success");
      onDeleteClick?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? err?.message ?? "삭제에 실패했습니다.";
      showToast(msg, "error");
    } finally {
      setIsMenuOpen(false);
    }
  }, [isSeller, adminToken, auctionId, onDeleteClick, showToast]);

  // 입찰
  const { submitBid, loading } = useBid({
    onSuccess: (res) => {
      propShowToast("입찰이 완료되었습니다.", "success");
      const nextPrice = res.item?.bidPrice;
      onAfterBid?.({
        currentPrice: Number.isFinite(nextPrice)
          ? (nextPrice as number)
          : undefined,
      });
      setIsBidModalOpen(false);
    },
    onError: (msg) => {
      showToast(msg, "error");
    },
  });

  // 모달 가드
  const handleOpenBidModal = React.useCallback(() => {
    // 로그인 체크
    if (!userId) {
      showToast("로그인이 필요합니다.", "error");
      return;
    }
    // 본인 상품 체크
    if (sellerId === userId) {
      showToast("본인 상품에는 입찰할 수 없습니다.", "error");
      return;
    }
    // 판매 상태 가드
    if (sellingStatus && sellingStatus !== "진행중") {
      showToast("현재 입찰할 수 없는 상태입니다.", "error");
      return;
    }
    setIsBidModalOpen(true);
  }, [userId, sellerId, sellingStatus, showToast]);

  const handleBidSubmit = useCallback(
    async (bidPrice: number) => {
      // 이중 가드
      if (!userId) {
        showToast("로그인이 필요합니다.", "error");
        return;
      }

      // 최솟값 체크
      if (bidPrice === 0) {
        showToast("입찰 가능 금액 이상 입력해 주세요.", "error");
        return;
      }

      // 기본 전제 값 체크
      if (
        !Number.isFinite(auctionId) ||
        !Number.isFinite(currentPrice) ||
        !Number.isFinite(minBidPrice)
      ) {
        showToast("입찰 정보를 확인할 수 없습니다.", "error");
        return;
      }

      try {
        await submitBid({ auctionId, userId, bidPrice });
      } catch {
        // 토스트 처리
      }
    },
    [auctionId, currentPrice, minBidPrice, userId, submitBid, showToast]
  );

  // 채팅방 생성
  const handleChatAdd = async (auctionId: number, sellerId: number) => {
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
          {/* 카테고리/제목/더보기 */}
          <div className="flex">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-1.5 md:gap-2 lg:gap-3.5">
              {/* 카테고리 */}
              {(categoryMain || categorySub) && (
                <div className="text-g300 text-h7 md:text-h6 sm:text-base">
                  {categoryMain ?? "카테고리"}
                  {categorySub ? ` > ${categorySub}` : ""}
                </div>
              )}

              {/* 제목 */}
              {title && (
                <div>
                  <span className="text-g100 text-h4 sm:text-h4 md:text-h3 lg:text-h2 leading-none font-bold break-words whitespace-normal">
                    {title}
                  </span>
                </div>
              )}
            </div>

            {/* 더보기 */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen((v) => !v)}
                className="hover:bg-g500/50 rounded-full p-1.5 transition-colors sm:p-2"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="더보기"
              >
                <EllipsisVertical className="text-g200 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
              </button>

              {isMenuOpen && (
                <div
                  role="menu"
                  className="border-g400 absolute top-full right-0 z-10 w-18 rounded-md border bg-white shadow-sm"
                >
                  <button
                    onClick={handleShare}
                    className="text-g100 hover:bg-g500 w-full cursor-pointer px-3.5 py-2.5 text-center text-base transition-colors md:py-2.5"
                    role="menuitem"
                  >
                    공유
                  </button>

                  {(isSeller || adminToken) && (
                    <button
                      onClick={handleDeleteAuction}
                      className="border-g400 text-red hover:bg-g500 w-full cursor-pointer border-t px-3.5 py-2.5 text-center text-base transition-colors md:py-2.5"
                      role="menuitem"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 판매자 정보 */}
          {(sellerNickname || sellerProfileImageUrl) && (
            <Link
              to={userId === sellerId ? "/mypage" : `/users/${sellerId}`}
              className="flex cursor-pointer items-center gap-2 sm:gap-3 md:gap-4"
            >
              <div className="bg-g500 h-11 w-11 flex-shrink-0 overflow-hidden rounded-full sm:h-12 sm:w-12 md:h-13 md:w-13 lg:h-17 lg:w-17">
                {sellerProfileImageUrl && (
                  <img
                    src={buildImageUrl(sellerProfileImageUrl) ?? undefined}
                    alt={sellerNickname ?? "판매자"}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                {sellerNickname && (
                  <span className="text-g100 text-h7 md:text-h6 lg:text-h5 max-w-[50vw] truncate font-medium sm:text-base md:max-w-none">
                    {sellerNickname}
                  </span>
                )}
                <span className="text-g300 text-h8 sm:text-h7 lg:text-h6 whitespace-nowrap md:text-base">
                  {sellerTemperature ?? 0}°C
                </span>
              </div>
            </Link>
          )}

          {/* 가격/최소 입찰 단위 */}
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

          {/* 버튼들 */}
          <div className="flex flex-col justify-end gap-1 sm:gap-1.5 md:gap-2 lg:gap-3.5">
            <div className="flex items-stretch gap-2 md:gap-1.5">
              <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2 md:gap-2.5">
                <button
                  onClick={
                    sellerId !== userId
                      ? () => handleChatAdd(auctionId, sellerId)
                      : () => showToast("본인이 판매 중인 상품입니다", "error")
                  }
                  className="text-h7 md:text-h6 lg:text-h5 border-purple text-purple hover:bg-light-purple cursor-pointer rounded-md border py-2 font-bold transition-colors sm:py-3 sm:text-base md:py-4"
                >
                  판매자와 대화
                </button>
                <button
                  onClick={handleOpenBidModal}
                  className="text-h7 md:text-h6 lg:text-h5 bg-purple hover:bg-deep-purple cursor-pointer rounded-md py-2 font-bold text-white transition-colors sm:py-3 sm:text-base md:py-4"
                  disabled={
                    loading ||
                    typeof currentPrice !== "number" ||
                    typeof minBidPrice !== "number"
                  }
                >
                  {loading ? "입찰 중…" : "입찰"}
                </button>
              </div>

              <WishButton
                auctionId={auctionId}
                initial={{ liked, wishCount: wishCount ?? 0 }}
                sellerId={sellerId}
                size="lg"
              />
            </div>

            {/* 기간/입찰 횟수 */}
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

      {/* 토스트 */}
      {toast.isVisible && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
};

export default ProductInfo;
