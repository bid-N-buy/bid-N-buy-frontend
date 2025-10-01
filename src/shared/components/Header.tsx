import React from "react";
import { Search, Menu, MessageCircleMore, Bell } from "lucide-react";

const Header = () => {
  return (
    <header className="m-auto h-20 w-full md:h-23">
      <div className="flex h-full items-center justify-between gap-8 px-6 lg:px-10 xl:px-40">
        <a className="font-logo text-h3 md:text-h2 lg:text-h1 block">
          Bid<span className="text-purple">&amp;</span>Buy
        </a>
        <form
          action="submit"
          className="hidden w-100 items-center justify-between border-1 border-gray-400 px-3 py-2 text-sm md:flex lg:w-200 dark:bg-gray-900 dark:text-gray-400 dark:placeholder:text-gray-600"
        >
          <input
            type="search"
            id="search"
            placeholder="검색어를 입력해 주세요"
            className="w-[90%] min-w-[120px] focus:outline-none lg:min-w-[250px]"
          />
          <button>
            <Search color="#8322bf" />
          </button>
        </form>
        <nav className="block md:hidden">
          <ul className="flex gap-4">
            <li>
              <a href="">
                <Search />
              </a>
            </li>
            <li>
              <a href="">
                <Menu />
              </a>
            </li>
          </ul>
        </nav>
        <nav className="hidden md:block">
          <ul className="text-h7 flex gap-4 text-nowrap">
            <li>
              <a href="/mypage">
                <span className="font-bold">User</span>님 환영합니다.
              </a>
            </li>
            <li>
              <a href="/">로그아웃</a>
            </li>
            {/* <li>
              <a href="/login">로그인</a>
            </li> */}
            {/* <li>
              <a href="/signup">회원가입</a>
            </li> */}
            <li>
              <a href="/cs">문의하기</a>
            </li>
            <li>
              <button>
                <MessageCircleMore />
              </button>
            </li>
            <li>
              <button>
                <Bell />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
