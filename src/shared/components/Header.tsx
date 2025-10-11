import React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, MessageCircleMore, Bell } from "lucide-react";
import New from "./New";
import ChatModal from "../../features/chatting/pages/ChatModal";
import NotiModal from "../../features/notification/pages/NotiModal";

const Header = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);

  // 검색 버튼을 클릭하면 검색화면으로 이동
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 폼 submit시 새로고침 방지
    if (!searchQuery.trim()) return; // 빈값 방지
    // `/search?query=검색어` 경로로 이동
    navigate(`search?query=${encodeURIComponent(searchQuery)}`);
  };

  // portal용 div 확인 위한 변수 추가
  const modalRoot = document.getElementById("modal-root");

  useEffect(() => {
    // 미디어 쿼리 객체 생성
    const mediaQueryList = window.matchMedia("screen and (max-width: 768px)");

    // 모달 아래 화면 스크롤 잠금/해제 로직
    const applyScrollLock = () => {
      const isSmallScreen = mediaQueryList.matches;

      if ((isChatOpen || isNotiOpen) && isSmallScreen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };

    applyScrollLock();

    // 리스너 등록
    mediaQueryList.addEventListener("change", applyScrollLock);

    // Cleanup
    return () => {
      // 리스너 제거
      mediaQueryList.removeEventListener("change", applyScrollLock);
      // 최종 overflow 해제
      document.body.style.overflow = "";
    };
  }, [isChatOpen, isNotiOpen]); // 모달 상태가 바뀔 때마다 실행되어야 함

  // modalRoot이 존재하지 않으면 렌더링 x
  if (!modalRoot) {
    console.error("Portal root element '#modal-root' not found.");
    return null;
  }

  return (
    <header className="relative m-auto h-20 w-full md:h-23">
      <div className="flex h-full items-center justify-between gap-8 px-6 lg:px-10 xl:px-40">
        <Link to="/" className="font-logo text-h3 md:text-h2 lg:text-h1 block">
          Bid<span className="text-purple">&amp;</span>Buy
        </Link>
        <form
          action="submit"
          onSubmit={handleSearch}
          className="hidden w-100 items-center justify-between rounded-md border-1 border-gray-400 px-3 py-2 text-sm md:flex lg:w-200 dark:bg-gray-900 dark:text-gray-400 dark:placeholder:text-gray-600"
        >
          <input
            type="search"
            id="search"
            placeholder="검색어를 입력해 주세요"
            className="w-[90%] min-w-[120px] focus:outline-none lg:min-w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="검색">
            <Search color="#8322bf" />
          </button>
        </form>
        <nav className="block md:hidden">
          <ul className="flex gap-4">
            <li>
              <Link to="/search" title="검색 화면 이동">
                <Search />
              </Link>
            </li>
            <li>
              <button>
                <Menu />
              </button>
            </li>
          </ul>
        </nav>
        <nav className="hidden md:block">
          <ul className="text-h7 flex gap-4 text-nowrap">
            <li>
              <Link to="/mypage">
                <span className="font-bold">User</span>님 환영합니다.
              </Link>
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
              <button className="relative" onClick={() => setIsChatOpen(true)}>
                <MessageCircleMore />
                <New />
              </button>
            </li>
            {isChatOpen &&
              createPortal(
                <ChatModal onClose={() => setIsChatOpen(false)} />,
                modalRoot
              )}
            <li>
              <button className="relative" onClick={() => setIsNotiOpen(true)}>
                <Bell />
              </button>
            </li>
            {isNotiOpen &&
              createPortal(
                <NotiModal
                  onClose={() => setIsNotiOpen(false)}
                  onDelete={() => setIsNotiOpen(false)}
                />,
                modalRoot
              )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
