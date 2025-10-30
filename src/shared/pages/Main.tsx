import React, { useEffect } from "react";
import Banner1 from "../../assets/banner1.svg";
import Banner2 from "../../assets/banner2.svg";
import Banner3 from "../../assets/banner3.svg";
import BannerSlider from "../components/BannerSlider";
import { useNavigate } from "react-router-dom";
import { useCategoryStore } from "../../features/auction/store/categoryStore";
import { getCategoryIcon } from "../utils/iconMap";
import AuctionSection from "../components/AuctionSection";
import AuctionGuideCard from "../components/AuctionGuideCard";
import ServiceIntroCard from "../components/ServiceIntroCard";

const banners = [
  { src: Banner1, to: "/auctions/new", alt: "Banner 1" }, // 로그인 -> 경매 등록, 비로그인 -> 로그인 페이지
  { src: Banner2, to: "/auctions?mainCategoryId=2", alt: "Banner 2" },
  { src: Banner3, to: "/signup", alt: "Banner 3" }, // 로그인 -> 메인(이동x), 비로그인 -> 회원가입
];

const Main = () => {
  const navigate = useNavigate();
  const { mains, loadingTop, loadTop } = useCategoryStore();

  useEffect(() => {
    loadTop().catch(console.error);
  }, [loadTop]);

  const handleCategoryClick = (mainId: number) => {
    navigate(`/auctions?mainCategoryId=${mainId}`);
  };

  return (
    <div className="w-full">
      {/* 배너 (1320 x 500) */}
      <section className="pt-[60px] pb-[60px] md:pb-0">
        <div className="container">
          <BannerSlider items={banners} />
        </div>
      </section>

      {/* 카테고리 */}
      <section className="hidden py-[60px] md:block">
        <div className="container">
          <div className="flex items-center justify-between gap-4 overflow-x-auto md:overflow-visible">
            {/* 스켈레톤 */}
            {loadingTop
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className="bg-g500/60 h-[90px] w-[90px] animate-pulse rounded-full" />
                    <div className="bg-g500/60 h-[16px] w-[48px] animate-pulse" />
                  </div>
                ))
              : mains.map((c) => {
                  const Icon = getCategoryIcon(c.categoryId);
                  return (
                    <button
                      key={c.categoryId}
                      onClick={() => handleCategoryClick(c.categoryId)}
                      className="group flex min-w-[96px] cursor-pointer flex-col items-center gap-3 transition-all"
                      aria-label={`${c.categoryName} 카테고리로 이동`}
                    >
                      <div className="group-hover:bg-light-purple flex h-[90px] w-[90px] items-center justify-center rounded-full bg-white shadow-[0_0_15px_rgba(0,0,0,0.09)] transition-all group-hover:shadow-[0_0_20px_rgba(0,0,0,0.12)]">
                        <Icon className="text-purple h-10 w-10 transition-transform group-hover:scale-110" />
                      </div>
                      <span className="text-g100 group-hover:text-purple text-h7 font-medium transition-colors">
                        {c.categoryName}
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>
      </section>

      <AuctionSection title="최신 경매 상품" size={10} moreLink="/auctions" />

      <section className="pb-[60px]">
        <div className="container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            <AuctionGuideCard />
            <ServiceIntroCard />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Main;
