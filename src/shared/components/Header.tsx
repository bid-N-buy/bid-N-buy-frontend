import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, MessageCircleMore, Bell, X } from "lucide-react";

import New from "./New";
import ChatModal from "../../features/chatting/pages/ChatModal";
import NotiModal from "../../features/notification/pages/NotiModal";

import {
  useAuthStore,
  type AuthState,
} from "../../features/auth/store/authStore";
import { useAuthInit } from "../../features/auth/hooks/UseAuthInit";
import api from "../../shared/api/axiosInstance";
import { useChatModalStore } from "../store/ChatModalStore";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 리프레시 재발급 완료 여부
  const { ready } = useAuthInit();

  // 전역 인증 상태
  const accessToken = useAuthStore((s: AuthState) => s.accessToken);
  const userNickname = useAuthStore(
    (s: AuthState) => s.profile?.nickname ?? "User"
  );
  const clearAuth = useAuthStore((s: AuthState) => s.clear);

  const { isChatOpen, openChatList, onClose } = useChatModalStore();

  // 로컬 상태
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isNotiOpen, setIsNotiOpen] = useState<boolean>(false);

  // 로그인 여부
  const isAuthed = useMemo<boolean>(
    () => ready && Boolean(accessToken),
    [ready, accessToken]
  );

  // url -> 입력 동기화
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const urlKeyword = sp.get("searchKeyword") ?? "";
    setSearchQuery(urlKeyword);
  }, [location.search]);

  // 검색
  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const q = searchQuery.trim();
    // 빈 검색어면 /auctions 로(전체 목록)
    const next = ((): URLSearchParams => {
      // 결과 목록 내 검색 시 기존 필터/정렬 유지
      if (location.pathname.startsWith("/auctions")) {
        const keep = new URLSearchParams(location.search);
        // 페이지 초기화
        keep.delete("page");
        // searchKeyword 설정/삭제
        if (q) keep.set("searchKeyword", q);
        else keep.delete("searchKeyword");
        return keep;
      }
      // 이외 경로에선 새 쿼리로
      const sp = new URLSearchParams();
      if (q) sp.set("searchKeyword", q);
      return sp;
    })();

    navigate(`/auctions?${next.toString()}`);
  };

  // 검색어 지우기
  const clearSearch = () => {
    setSearchQuery("");
    const sp = new URLSearchParams(location.search);
    sp.delete("searchKeyword");
    sp.delete("page");
    navigate(`/auctions?${sp.toString()}`);
  };

  // 로그아웃
  const handleLogout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout", null, { withCredentials: true });
    } catch {
      // 서버 실패해도 로컬 정리는 진행
    } finally {
      clearAuth();
      navigate("/", { replace: true });
    }
  };

  // 채팅 관련 함수
  // 모바일에서 모달 열릴 때 스크롤 잠금
  useEffect(() => {
    const mql: MediaQueryList = window.matchMedia(
      "screen and (max-width: 768px)"
    );
    const apply = (): void => {
      const small = mql.matches;
      document.body.style.overflow =
        (isChatOpen || isNotiOpen) && small ? "hidden" : "";
    };
    apply();
    mql.addEventListener("change", apply);
    return () => {
      mql.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, [isChatOpen, isNotiOpen]);

  // 포털 루트
  const modalRoot: HTMLElement | null = document.getElementById("modal-root");
  if (!modalRoot) {
    console.error("Portal root element '#modal-root' not found.");
    return null;
  }

  return (
    <header className="relative m-auto h-20 w-full md:h-23">
      <div className="flex h-full items-center justify-between gap-8 px-6 lg:px-10 xl:px-40">
        {/* 로고 */}
        <Link to="/" className="font-logo text-h3 md:text-h2 lg:text-h1 block">
          Bid<span className="text-purple">&amp;</span>Buy
        </Link>

        {/* 검색 (데스크탑) */}
        <form
          onSubmit={handleSearch}
          className="text-g100 focus-within:border-purple border-g300 dark:text-g400 text-h7 hidden w-100 items-center justify-between rounded-md border px-3 py-2.5 md:flex lg:w-200 dark:bg-gray-900 dark:placeholder:text-gray-600"
        >
          <input
            type="text"
            id="search"
            placeholder="검색어를 입력해 주세요"
            className="w-[90%] min-w-[120px] focus:outline-none lg:min-w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="검색어 지우기"
              className="mr-2"
              title="검색어 지우기"
            >
              <X />
            </button>
          )}
          <button type="submit" aria-label="검색" title="검색">
            <Search color="#8322bf" />
          </button>
        </form>

        {/* 모바일 우측 아이콘 */}
        <nav className="block md:hidden">
          <ul className="flex gap-4">
            <li>
              {/* 모바일은 검색 페이지 이동 후 거기서 입력 */}
              <Link to="/auctions" title="검색 화면 이동" aria-label="검색">
                <Search />
              </Link>
            </li>
            <li>
              <button aria-label="메뉴">
                <Menu />
              </button>
            </li>
          </ul>
        </nav>

        {/* 데스크탑 우측 메뉴 */}
        <nav className="hidden md:block">
          {!ready ? (
            // 재발급 대기 스켈레톤
            <ul className="flex gap-4">
              <li className="bg-g500 h-4 w-28 animate-pulse" />
              <li className="bg-g500 h-4 w-14 animate-pulse" />
              <li className="bg-g500 h-4 w-16 animate-pulse" />
            </ul>
          ) : isAuthed ? (
            // 로그인 후
            <ul className="text-h7 flex items-center gap-4 text-nowrap">
              <li>
                <Link to="/mypage">
                  <span className="font-bold">{userNickname}</span>님
                  환영합니다.
                </Link>
              </li>
              <li>
                <button onClick={handleLogout}>로그아웃</button>
              </li>
              <li>
                <Link to="/cs">문의하기</Link>
              </li>

              <li>
                <button
                  className="relative"
                  onClick={openChatList}
                  aria-label="채팅"
                  title="채팅"
                >
                  <MessageCircleMore />
                  <New />
                </button>
              </li>
              {isChatOpen &&
                createPortal(<ChatModal onClose={onClose} />, modalRoot)}
              <li>
                <button
                  className="relative"
                  onClick={() => setIsNotiOpen(true)}
                  aria-label="알림"
                  title="알림"
                >
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
          ) : (
            // 로그인 전
            <ul className="text-h7 flex gap-4 text-nowrap">
              <li>
                <Link to="/login">로그인</Link>
              </li>
              <li>
                <Link to="/signup">회원가입</Link>
              </li>
              <li>
                <Link to="/cs">문의하기</Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
