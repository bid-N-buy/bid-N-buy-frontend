import React from "react";
import {
  Package,
  Shirt,
  Monitor,
  Book,
  Home as HomeIcon,
  Coffee,
  Car,
  Gamepad2,
  Watch,
  Gift,
} from "lucide-react";
import Banner from "../components/Banner";
import MainSvg from "../../assets/main.svg";

const Main = () => {
  // 카테고리 더미 데이터
  const categories = [
    { id: 1, name: "패션", icon: Shirt },
    { id: 2, name: "디지털", icon: Monitor },
    { id: 3, name: "가구", icon: HomeIcon },
    { id: 4, name: "도서", icon: Book },
    { id: 5, name: "식품", icon: Coffee },
    { id: 6, name: "자동차", icon: Car },
    { id: 7, name: "게임", icon: Gamepad2 },
    { id: 8, name: "시계", icon: Watch },
    { id: 9, name: "선물", icon: Gift },
    { id: 10, name: "기타", icon: Package },
  ];

  return (
    <div className="w-full">
      {/* 배너 */}
      <section className="pt-[60px]">
        <div className="container">
          {/* <div className="bg-g500 flex h-[500px] w-full items-center justify-center">
            <span className="text-g300 text-[20px]">
              배너 영역 (1320 x 500)
            </span>
          </div> */}
          <Banner src={MainSvg} to="" alt="배너" />
        </div>
      </section>

      {/* 카테고리 */}
      <section className="py-[60px]">
        <div className="container">
          <div className="flex items-center justify-between gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  className="flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
                >
                  <div className="bg-g500 hover:bg-purple/10 flex h-[90px] w-[90px] items-center justify-center rounded-full transition-colors">
                    <Icon className="text-g300 h-10 w-10" />
                  </div>
                  <span className="text-g100 text-[15px] font-medium">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 판매 중인 상품 영역 */}
      <section className="pb-[60px]">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h4 className="text-g100 font-bold">경매 중인 상품</h4>
            <button className="text-g300 hover:text-purple text-[15px] transition-colors">
              전체보기
            </button>
          </div>

          {/* 그리드 */}
          <div className="bg-g500 flex min-h-[500px] w-full items-center justify-center">
            <span className="text-g300 text-[20px]">
              경매 중인 상품 영역 (1320 x 500+)
            </span>
          </div>
        </div>
      </section>

      {/* 보류 */}
      <section className="pb-[60px]">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h4 className="text-g100 font-bold">(보류) 인기 경매</h4>
            <button className="text-g300 hover:text-purple text-[15px] transition-colors">
              전체보기
            </button>
          </div>

          <div className="bg-g500 flex min-h-[500px] w-full items-center justify-center">
            <span className="text-g300 text-[20px]">보류 영역</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Main;
