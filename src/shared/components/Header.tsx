import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  MessageCircleMore,
  Bell,
  X,
  ChevronRight,
  Plus,
  LogIn,
  LogOut,
} from "lucide-react";
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
import { useNotiStore } from "../../features/notification/store/notiStore";
import { useCategoryStore } from "../../features/auction/store/categoryStore";
import type { CategoryNode } from "../../features/auction/api/categories";

const Header = () => {
  const notis = useNotiStore((s) => s.notis);
  const hasNew = notis.some((n) => !n.read);

  const navigate = useNavigate();
  const location = useLocation();

  const { ready } = useAuthInit();

  const accessToken = useAuthStore((s: AuthState) => s.accessToken);
  const profile = useAuthStore((s: AuthState) => s.profile);
  const setProfile = useAuthStore((s: AuthState) => s.setProfile);
  const userNickname = profile?.nickname ?? "User";
  const clearAuth = useAuthStore((s: AuthState) => s.clear);

  const totalUnreadCount = useChatModalStore((state) => state.totalUnreadCount);

  const openChatList = useChatModalStore((state) => state.openChatList);
  const onClose = useChatModalStore((state) => state.onClose);
  const fetchChatList = useChatModalStore((state) => state.fetchChatList);
  const isChatOpen = useChatModalStore((state) => state.isChatOpen);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isNotiOpen, setIsNotiOpen] = useState<boolean>(false);

  // 모바일 메뉴
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { mains, subsByParent, loadingTop, loadTop, loadSubs } =
    useCategoryStore();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const isAuthed = useMemo<boolean>(
    () => ready && Boolean(accessToken),
    [ready, accessToken]
  );

  // 카테고리
  useEffect(() => {
    loadTop().catch(() => {});
  }, [loadTop]);

  const onExpand = async (m: CategoryNode) => {
    const isOpen = expandedCategory === String(m.categoryId);
    setExpandedCategory(isOpen ? null : String(m.categoryId));
    if (!subsByParent[m.categoryId]?.length) {
      await loadSubs(m.categoryId).catch(() => {});
    }
  };

  // 로그인/리프레시 하고 프로필 없으면 한 번 불러오기
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthed) return;
      if (profile?.nickname) return;
      try {
        const { data } = await api.get("/mypage", {
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

  useEffect(() => {
    if (!isAuthed || !accessToken) {
      return;
    }
    fetchChatList(accessToken);
  }, [isAuthed, accessToken, fetchChatList]);

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
    const sp = new URLSearchParams();
    if (q) sp.set("searchKeyword", q);
    navigate(`/auctions?${sp.toString()}`);
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
      setIsMobileMenuOpen(false);
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
        (isChatOpen || isNotiOpen || isMobileMenuOpen) && small ? "hidden" : "";
    };

    apply();
    mql.addEventListener("change", apply);

    return () => {
      mql.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, [isChatOpen, isNotiOpen, isMobileMenuOpen]);

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
            placeholder="상품명을 입력해 주세요"
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
          <button
            type="submit"
            aria-label="검색"
            title="검색"
            className="cursor-pointer"
          >
            <Search color="#8322bf" />
          </button>
        </form>

        {/* 모바일 아이콘 */}
        <nav className="block md:hidden">
          <ul className="flex gap-4">
            <li>
              <Link to="/auctions" title="검색 화면 이동" aria-label="검색">
                <Search className="hover:text-purple transition-colors" />
              </Link>
            </li>
            <li>
              <button
                aria-label="메뉴"
                onClick={() => setIsMobileMenuOpen(true)}
                className="hover:text-purple cursor-pointer transition-colors"
              >
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
            <ul className="text-h7 flex items-center text-nowrap">
              <li className="mr-3.5">
                <Link to="/mypage" className="cursor-pointer">
                  <span className="font-bold">{userNickname}</span>님
                  환영합니다!
                </Link>
              </li>
              <li className="mr-3.5">
                <button
                  onClick={handleLogout}
                  className="hover:text-purple cursor-pointer transition-colors"
                >
                  로그아웃
                </button>
              </li>
              <li className="mr-5.5">
                <Link
                  to="/auctions/new"
                  className="text-purple hover:text-deep-purple cursor-pointer font-bold transition-colors"
                >
                  경매등록
                </Link>
              </li>
              <li className="mr-3.5">
                <button
                  className="hover:text-purple relative cursor-pointer transition-colors"
                  onClick={openChatList}
                  aria-label="채팅"
                  title="채팅"
                >
                  <MessageCircleMore className="mb-0.5 h-6 w-6" />
                  {totalUnreadCount >= 1 && <New />}
                </button>
              </li>
              {isChatOpen &&
                createPortal(<ChatModal onClose={onClose} />, modalRoot)}
              <li>
                <button
                  className="hover:text-purple relative cursor-pointer transition-colors"
                  onClick={() => setIsNotiOpen(true)}
                  aria-label="알림"
                  title="알림"
                >
                  {/* 안 읽은 알람 있을 때만 표시 */}
                  <Bell className="h-6 w-6" />
                  {hasNew && <New />}
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
                <Link
                  to="/login"
                  className="hover:text-purple cursor-pointer transition-colors"
                >
                  로그인
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="hover:text-purple cursor-pointer transition-colors"
                >
                  회원가입
                </Link>
              </li>
              <li>
                <Link
                  to="/mypage/inquiries"
                  className="hover:text-purple cursor-pointer transition-colors"
                >
                  문의하기
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="absolute top-0 right-0 flex h-full w-[70vw] max-w-sm flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상단 */}
            <div className="border-g500 flex items-center justify-between border-b p-6">
              <h4 className="text-g100 text-h4 font-bold">메뉴</h4>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-g300 hover:text-purple cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 카테고리 */}
            <div className="flex-1 overflow-y-auto p-6">
              <h5 className="text-g100 text-h5 mb-4 font-bold">카테고리</h5>
              {loadingTop ? (
                <div className="text-g300 text-h7">불러오는 중…</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {mains.map((m: CategoryNode) => {
                    const isOpen = expandedCategory === String(m.categoryId);
                    const subs = subsByParent[m.categoryId] ?? [];

                    return (
                      <div key={m.categoryId} className="flex flex-col">
                        <button
                          onClick={() => onExpand(m)}
                          className="text-g100 hover:text-purple flex cursor-pointer items-center justify-between py-2 text-left text-base transition-colors"
                        >
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/auctions?mainCategoryId=${m.categoryId}`
                              );
                              setIsMobileMenuOpen(false);
                            }}
                            className="font-semibold"
                          >
                            {m.categoryName}
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                          />
                        </button>

                        {isOpen && (
                          <div className="mt-2 ml-4 flex flex-col gap-2">
                            {subs.map((s) => (
                              <button
                                key={s.categoryId}
                                onClick={() => {
                                  navigate(
                                    `/auctions?subCategoryId=${s.categoryId}`
                                  );
                                  setIsMobileMenuOpen(false);
                                }}
                                className="text-g200 hover:text-purple text-h7 cursor-pointer py-1 text-left transition-colors"
                              >
                                {s.categoryName}
                              </button>
                            ))}
                            {subs.length === 0 && (
                              <div className="text-g300 text-h7 py-1">
                                소분류 없음
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 하단 */}
            <div className="border-g500 bg-g500/30 border-t p-6">
              {!ready ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-g400 h-10 w-full animate-pulse rounded-md" />
                  <div className="bg-g400 h-10 w-full animate-pulse rounded-md" />
                </div>
              ) : isAuthed ? (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => {
                      navigate("/mypage");
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-g100 hover:text-purple mb-1.5 cursor-pointer text-left text-base transition-colors"
                  >
                    <span className="font-bold">{userNickname}</span>님
                    환영합니다!
                  </button>

                  <div className="grid grid-cols-4 gap-3">
                    <button
                      onClick={() => {
                        navigate("/auctions/new");
                        setIsMobileMenuOpen(false);
                      }}
                      className="hover:bg-light-purple flex flex-col items-center gap-2 rounded-md p-3 transition-colors"
                    >
                      <Plus className="text-purple h-6 w-6" />
                      <span className="text-g200 text-h8">경매등록</span>
                    </button>

                    <button
                      onClick={() => {
                        openChatList();
                        setIsMobileMenuOpen(false);
                      }}
                      className="hover:bg-light-purple relative flex flex-col items-center gap-2 rounded-md p-3 transition-colors"
                    >
                      <MessageCircleMore className="text-purple h-6 w-6" />
                      {totalUnreadCount >= 1 && <New />}
                      <span className="text-g200 text-h8">채팅</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsNotiOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="hover:bg-light-purple relative flex flex-col items-center gap-2 rounded-md p-3 transition-colors"
                    >
                      <Bell className="text-purple h-6 w-6" />
                      {hasNew && <New />}
                      <span className="text-g200 text-h8">알림</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="hover:bg-light-purple flex flex-col items-center gap-2 rounded-md p-3 transition-colors"
                    >
                      <LogOut className="text-g200 h-6 w-6" />
                      <span className="text-g200 text-h8">로그아웃</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-purple hover:bg-deep-purple text-h7 flex items-center justify-center gap-2 rounded-md py-3 font-bold text-white transition-colors"
                  >
                    <span>로그인</span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="border-purple text-purple hover:bg-light-purple text-h7 flex items-center justify-center gap-2 rounded-md border py-3 font-bold transition-colors"
                  >
                    <span>회원가입</span>
                  </Link>
                  <Link
                    to="/mypage/inquiries"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-g200 hover:text-purple text-h7 py-2 text-center transition-colors"
                  >
                    문의하기
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 채팅 모달 */}
      {isChatOpen && createPortal(<ChatModal onClose={onClose} />, modalRoot)}

      {/* 알림 모달 */}
      {isNotiOpen &&
        createPortal(
          <NotiModal
            onClose={() => setIsNotiOpen(false)}
            onDelete={() => setIsNotiOpen(false)}
          />,
          modalRoot
        )}
    </header>
  );
};

export default Header;
