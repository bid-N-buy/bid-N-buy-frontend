import React, { useState } from "react";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  minBidPrice: number;
  productTitle?: string;
  onBidSubmit: (bidPrice: number) => void;
}

const BidModal = ({
  isOpen,
  onClose,
  currentPrice,
  minBidPrice,
  productTitle = "상품명",
  onBidSubmit,
}: BidModalProps) => {
  const [bidPrice, setBidPrice] = useState<string>("");
  const minValidBid = currentPrice + minBidPrice;

  const handleSubmit = () => {
    const numericBid = Number(bidPrice.replace(/,/g, ""));

    if (numericBid < minValidBid) {
      onBidSubmit(0); // 0 전달 시 에러 처리
      return;
    }

    onBidSubmit(numericBid);
    setBidPrice("");
  };

  const handleCancel = () => {
    setBidPrice("");
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value) {
      setBidPrice(Number(value).toLocaleString());
    } else {
      setBidPrice("");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={handleCancel} />
      {/* 모달 */}
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-md bg-white p-8 shadow-xl">
          {/* 헤더 */}
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-g100 font-bold">입찰하기</h4>
          </div>

          {/* 본문 */}
          <div className="mb-6">
            <span className="text-g300 text-h7">상품명</span>
            <p className="text-g100 text-h6 mt-1 font-semibold">
              {productTitle}
            </p>
          </div>

          <div className="mb-6">
            <span className="text-g300 text-h7">현재가</span>
            <p className="text-g100 text-h6 mt-1 font-semibold">
              {currentPrice.toLocaleString()}원
            </p>
          </div>

          <div className="mb-8">
            <label className="text-g300 text-h7 block">입찰가</label>
            <p className="text-g300 text-h8 mt-1 mb-2">
              입찰 가능 금액은 {minValidBid.toLocaleString()}원 이상입니다.
            </p>
            <div className="relative">
              <input
                type="text"
                value={bidPrice}
                onChange={handleInputChange}
                placeholder="입찰 금액을 입력해 주세요."
                className="border-g300 focus:border-purple text-h7 w-full rounded-md border px-4 py-3 focus:outline-none"
              />
              <span className="text-g100 absolute top-1/2 right-4 -translate-y-1/2">
                원
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCancel}
              className="border-purple text-purple hover:bg-light-purple text-6 cursor-pointer rounded-md border py-4 font-semibold transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="text-6 bg-purple hover:bg-deep-purple cursor-pointer rounded-md py-4 font-semibold text-white transition-colors"
            >
              입찰
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BidModal;
