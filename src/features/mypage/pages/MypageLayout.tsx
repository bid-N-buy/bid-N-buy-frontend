import React from "react";
import SideBar from "../components/SideBar";
import { Outlet } from "react-router-dom";

const MypageLayout: React.FC = () => {
  return (
    <div className="mx-auto mt-[20px] w-full max-w-[1095px] px-4 pb-16 md:mt-[100px] md:px-0 md:pb-32">
      <div className="flex flex-col gap-6 md:flex-row md:gap-[82px]">
        <aside className="h-fit w-full md:top-24 md:shrink-0 md:basis-[225px] md:self-start">
          <SideBar />
        </aside>
        <section className="mb-16 flex max-w-full min-w-0 flex-1 flex-col gap-[60px] md:mb-24">
          <Outlet />
        </section>
      </div>
    </div>
  );
};

export default MypageLayout;
