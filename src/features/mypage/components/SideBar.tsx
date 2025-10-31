// src/features/mypage/components/SideBar.tsx
import React from "react";
import { NavLink } from "react-router-dom";

const itemBase = "block rounded-md px-2 py-1 transition";
const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    itemBase,
    isActive
      ? "font-extrabold text-neutral-900"
      : "font-medium text-neutral-700 hover:text-neutral-900",
  ].join(" ");

// 칩(버튼) 스타일 – 모바일 열 너비를 꽉 채우도록 w-full + justify-center
const chipBase =
  "inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-sm";
const chipSize = "h-9 px-3 text-[12px] font-semibold";
const chipInactive = "text-neutral-700 hover:text-neutral-900";
const chipActive = "text-neutral-900 border-neutral-300";
const chipClass = ({ isActive }: { isActive: boolean }) =>
  [
    chipBase,
    chipSize,
    isActive ? chipActive : chipInactive,
    "whitespace-nowrap",
  ].join(" ");

const SideBar: React.FC = () => {
  return (
    <>
      {/* ===================== 모바일(<=md): 3열 꽉 채우기, 스크롤/최소폭 제거 ===================== */}
      <div className="w-full md:hidden">
        <div className="grid w-full grid-cols-3 gap-x-3 gap-y-3">
          {/* 1행: 제목 */}
          <h3 className="col-span-1 text-center text-sm font-extrabold">
            쇼핑정보
          </h3>
          <h3 className="col-span-1 text-center text-sm font-extrabold">
            나의정보
          </h3>
          <h3 className="col-span-1 text-center text-sm font-extrabold">
            문의목록
          </h3>

          {/* 2행: 각 열 버튼들(열 너비 꽉 채움) */}
          <div className="col-span-1 flex flex-col items-stretch gap-2">
            <NavLink to="/mypage/purchases" className={chipClass}>
              구매내역
            </NavLink>
            <NavLink to="/mypage/sales" className={chipClass}>
              판매내역
            </NavLink>
            <NavLink to="/mypage/wishlist" className={chipClass}>
              찜목록
            </NavLink>
          </div>

          <div className="col-span-1 flex flex-col items-stretch gap-2">
            <NavLink to="/mypage/account" className={chipClass}>
              내정보관리
            </NavLink>
          </div>

          <div className="col-span-1 flex flex-col items-stretch gap-2">
            <NavLink to="/mypage/inquiries" className={chipClass}>
              1:1문의/신고
            </NavLink>
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-200" />
      </div>

      {/* ===================== PC(>=md): 기존 사이드바 유지 ===================== */}
      <div className="mb-[150px] hidden h-[514px] w-[225px] flex-col text-neutral-900 md:flex">
        <NavLink to="/mypage">
          {({ isActive }) => (
            <h1 className={isActive ? "mb-8 font-extrabold" : "mb-8 font-bold"}>
              마이 페이지
            </h1>
          )}
        </NavLink>

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
    </>
  );
};

export default SideBar;
