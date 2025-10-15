import React from "react";

const AuctionGuide = () => {
  return (
    <section
      className="flex min-h-[232px] flex-col gap-1.5 px-1.5 sm:gap-1.5 sm:px-3 md:gap-2 lg:gap-3.5"
      aria-label="경매 가이드"
    >
      <span className="text-g100 text-h5 sm:text-h4 font-bold">
        경매 가이드
      </span>

      <p className="text-g200 text-h7 md:text-h6 px-2 leading-relaxed whitespace-pre-line sm:text-base"></p>
    </section>
  );
};

export default AuctionGuide;
