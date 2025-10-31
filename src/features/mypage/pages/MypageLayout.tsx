import React from "react";
import SideBar from "../components/SideBar";
import { Outlet } from "react-router-dom";

const MypageLayout: React.FC = () => {
  return (
    <div
      // 페이지 자체에 충분한 하단 공간을 줘서 푸터와 겹치지 않도록
      className="mx-auto mt-[100px] w-full max-w-[1095px] px-4 pb-24 md:px-0 md:pb-32"
    >
      <div className="flex flex-col gap-6 md:flex-row md:gap-[82px]">
        {/* ✅ 사이드바: 모바일은 일반 흐름 / PC는 고정폭 + sticky */}
        <aside className="h-fit w-full md:top-24 md:shrink-0 md:basis-[225px] md:self-start">
          <SideBar />
        </aside>

        {/* ✅ 오른쪽 컨텐츠: 남는 공간 모두 사용 + 줄바꿈 깨짐 방지 + 하단 여백 */}
        <section className="mb-16 flex max-w-full min-w-0 flex-1 flex-col gap-[60px] md:mb-24">
          <Outlet />
        </section>
      </div>
    </div>
  );
};

export default MypageLayout;
