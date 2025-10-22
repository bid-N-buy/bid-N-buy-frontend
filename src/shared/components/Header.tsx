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

  const { ready } = useAuthInit();

  // ✅ 프로필도 함께 가져오도록 수정
  const accessToken = useAuthStore((s: AuthState) => s.accessToken);
  const profile = useAuthStore((s: AuthState) => s.profile);
  const setProfile = useAuthStore((s: AuthState) => s.setProfile);
  const userNickname = profile?.nickname ?? "User";
  const clearAuth = useAuthStore((s: AuthState) => s.clear);

  const { isChatOpen, openChatList, onClose } = useChatModalStore();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isNotiOpen, setIsNotiOpen] = useState<boolean>(false);

  const isAuthed = useMemo<boolean>(
    () => ready && Boolean(accessToken),
    [ready, accessToken]
  );

  // ✅ 리프레시/로그인 완료 후, 프로필 없으면 한 번 불러오기
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthed) return;
      if (profile?.nickname) return; // 이미 있으면 skip
      try {
        const { data } = await api.get("/mypage", {
          // 실패해도 전체 앱 흐름 막지 않기
          validateStatus: (s) => s >= 200 && s < 500,
        });
        const nickname = data?.nickname ?? "";
        const email = data?.email ?? "";
        if (!cancelled && (nickname || email)) {
          setProfile({ nickname, email });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed, profile?.nickname, setProfile]);

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
    const next = ((): URLSearchParams => {
      if (location.pathname.startsWith("/auctions")) {
        const keep = new URLSearchParams(location.search);
        keep.delete("page");
        if (q) keep.set("searchKeyword", q);
        else keep.delete("searchKeyword");
        return keep;
      }
      const sp = new URLSearchParams();
      if (q) sp.set("searchKeyword", q);
      return sp;
    })();
    navigate(`/auctions?${next.toString()}`);
  };

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

  // 모바일 모달 시 스크롤 잠금
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

  const modalRoot: HTMLElement | null = document.getElementById("modal-root");
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

        {/* 모바일 아이콘 */}
        <nav className="block md:hidden">
          <ul className="flex gap-4">
            <li>
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

        {/* 우측 메뉴 */}
        <nav className="hidden md:block">
          {!ready ? (
            <ul className="flex gap-4">
              <li className="bg-g500 h-4 w-28 animate-pulse" />
              <li className="bg-g500 h-4 w-14 animate-pulse" />
              <li className="bg-g500 h-4 w-16 animate-pulse" />
            </ul>
          ) : isAuthed ? (
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
                <Link to="/mypage/inquiries">문의하기</Link>
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
            <ul className="text-h7 flex gap-4 text-nowrap">
              <li>
                <Link to="/login">로그인</Link>
              </li>
              <li>
                <Link to="/signup">회원가입</Link>
              </li>
              <li>
                <Link to="/mypage/inquiries">문의하기</Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
