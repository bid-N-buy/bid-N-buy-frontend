import React from "react";
import SideBar from "../components/SideBar";
import { Outlet } from "react-router-dom";

const MypageLayout = () => {
  return (
    <div className="m-auto mt-[100px] flex w-[1095px] gap-[82px]">
      {/* ✅ 사이드바는 항상 고정 */}
      <SideBar />

      {/* ✅ 오른쪽(컨텐츠 영역)은 라우트로 변경됨 */}
      <div className="mb-[150px] flex w-[786px] flex-col gap-[60px]">
        <Outlet />
      </div>
    </div>
  );
};

export default MypageLayout;
