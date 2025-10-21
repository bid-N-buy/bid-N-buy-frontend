import React from "react";

const AuctionGuide = () => {
  return (
    <section
      className="flex min-h-[232px] flex-col gap-1.5 px-1.5 sm:gap-1.5 sm:px-3 md:gap-2 lg:gap-4"
      aria-label="경매 가이드"
    >
      <span className="text-g100 text-h5 sm:text-h4 font-bold">
        경매 가이드
      </span>

      <div className="text-g100 text-h7 md:text-h6 px-2 leading-relaxed whitespace-pre-line sm:text-base">
        <p>
          <strong>Bid&Buy</strong> 는 중고거래에 경매 방식을 더한 서비스입니다.
          <br />
          회원이라면 누구나 상품을 등록하고 입찰에 참여할 수 있습니다.
        </p>
        <br />
        <p>
          <strong>상품 등록</strong>
          <br />
          상품 이미지, 상품명, 카테고리, 상품 설명을 입력하세요.
          <br />
          시작가, 최소 입찰 단위, 시작·마감일시를 직접 설정할 수 있습니다.
          <br />
          설정한 시작일시에 맞춰 경매가 자동으로 시작됩니다.
        </p>
        <br />
        <p>
          <strong>입찰 참여</strong>
          <br />
          입찰 가능 금액을 확인한 다음 원하는 금액으로 입찰하세요.
          <br />
          마감일시 기준 가장 높은 금액을 제시한 회원이 낙찰됩니다.
          <br />
          (입찰은 한 번 참여하면 취소할 수 없으며, 낙찰 후 미결제 시 페널티가
          부과될 수 있습니다.)
        </p>
        <br />
        <p className="text-red">
          ※ 허위 상품 등록, 비정상적 입찰 등 거래 행위와 부적절한 표현 기타 위법
          소지가 있는 행위는 서비스 이용 제재 대상이 될 수 있습니다.
        </p>
      </div>
    </section>
  );
};

export default AuctionGuide;
