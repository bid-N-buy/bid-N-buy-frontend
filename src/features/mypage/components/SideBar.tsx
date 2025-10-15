import React from "react";
import { NavLink } from "react-router-dom";

const itemBase = "block rounded-md px-2 py-1 transition";
const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    itemBase,
    isActive
      ? "font-extrabold text-neutral-900" // 굵게
      : "font-medium text-neutral-700 hover:text-neutral-900",
  ].join(" ");

const SideBar = () => {
  return (
    <div className="flex h-[514px] w-[225px] flex-col text-neutral-900">
      {/* 타이틀 */}
      <NavLink to="/mypage">
        {({ isActive }) => (
          <h1 className={isActive ? "mb-8 font-extrabold" : "mb-8 font-bold"}>
            마이 페이지
          </h1>
        )}
      </NavLink>

      {/* 섹션 1 */}
      <div className="mb-8">
        <h3 className="mb-4 font-bold">쇼핑 정보</h3>
        <ul className="flex flex-col gap-3">
          <li>
            <NavLink to="/mypage/purchases" className={itemClass}>
              구매 내역
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/sales" className={itemClass}>
              판매 내역
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/wishlist" className={itemClass}>
              찜 목록
            </NavLink>
          </li>
        </ul>
        <div className="mt-6 border-t border-neutral-300/50" />
      </div>

      {/* 섹션 2 */}
      <div className="mb-8 pt-6">
        <h3 className="mb-4 font-bold">나의 정보</h3>
        <ul className="flex flex-col gap-3">
          <li>
            <NavLink to="/mypage/account" className={itemClass}>
              내 정보 관리
            </NavLink>
          </li>
        </ul>
        <div className="mt-6 border-t border-neutral-300/50" />
      </div>

      {/* 섹션 3 */}
      <div className="pt-6">
        <h3 className="mb-4 font-bold">문의 목록</h3>
        <ul className="flex flex-col gap-3">
          <li>
            <NavLink to="/mypage/inquiries" className={itemClass}>
              1:1 문의 / 신고
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideBar;
