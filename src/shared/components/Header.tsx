// src/components/layout/Header.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, MessageCircleMore, Bell } from "lucide-react";

import New from "./New";
import ChatModal from "../../features/chatting/pages/ChatModal";
import NotiModal from "../../features/notification/pages/NotiModal";

import {
  useAuthStore,
  type AuthState,
} from "../../features/auth/store/authStore";
import { useAuthInit } from "../../features/auth/hooks/UseAuthInit";
import api from "../../shared/api/axiosInstance";

const Header: React.FC = () => {
  const navigate = useNavigate();

  // ✅ 리프레시 재발급 완료 여부
  const { ready } = useAuthInit();

  // ✅ 전역 인증 상태 (any 사용 없음)
  const accessToken = useAuthStore((s: AuthState) => s.accessToken);
  const userNickname = useAuthStore(
    (s: AuthState) => s.profile?.nickname ?? "User"
  );
  const clearAuth = useAuthStore((s: AuthState) => s.clear);

  // ✅ 로컬 상태
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isNotiOpen, setIsNotiOpen] = useState<boolean>(false);

  // ✅ 로그인 여부: 재발급 완료 && accessToken 존재
  const isAuthed = useMemo<boolean>(
    () => ready && Boolean(accessToken),
    [ready, accessToken]
  );

  // 검색 제출
  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`search?query=${encodeURIComponent(searchQuery)}`);
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

        {/* 모바일 우측 아이콘 */}
        <nav className="block md:hidden">
          <ul className="flex gap-4">
            <li>
              <Link to="/search" title="검색 화면 이동">
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
              <li className="h-4 w-28 animate-pulse rounded bg-gray-200" />
              <li className="h-4 w-14 animate-pulse rounded bg-gray-200" />
              <li className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </ul>
          ) : isAuthed ? (
            // ✅ 로그인 후
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
                  onClick={() => setIsChatOpen(true)}
                  aria-label="채팅"
                >
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
                <button
                  className="relative"
                  onClick={() => setIsNotiOpen(true)}
                  aria-label="알림"
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
            // ❌ 로그인 전
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
