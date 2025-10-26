import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import AdminAlarmPostModal from "./AdminAlertPostModal";
import {
  LayoutDashboard,
  NotebookText,
  MessageCircleWarning,
  Megaphone,
} from "lucide-react";

const AdminAsideMenu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRoot: HTMLElement | null = document.getElementById("modal-root");

  if (!modalRoot) {
    console.error("Portal root element '#modal-root' not found.");
    return null;
  }
  return (
    <aside className="flex h-screen w-16 flex-col justify-between border-e border-gray-100 bg-white">
      <div>
        <div className="inline-flex size-16 items-center justify-center">
          <span className="grid size-10 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600">
            B
          </span>
        </div>

        <nav className="border-t border-gray-100">
          <div className="px-2">
            <div className="py-4">
              <Link
                to="/admin"
                className="t group text-purple relative flex justify-center rounded-sm bg-purple-50 px-2 py-1.5"
              >
                <LayoutDashboard color="#8322bf" />

                <span className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                  Main
                </span>
              </Link>
            </div>

            <ul className="space-y-1 border-t border-gray-100 pt-4">
              <li>
                <Link
                  to="/admin/inquiries"
                  className="group relative flex justify-center rounded-sm px-2 py-1.5 hover:bg-gray-50"
                >
                  <MessageCircleWarning />

                  <span className="invisible absolute start-full top-1/2 ms-4 w-18.5 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    문의/신고 현황
                  </span>
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/users"
                  className="group relative flex justify-center rounded-sm px-2 py-1.5 hover:bg-gray-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-5 opacity-75"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>

                  <span className="invisible absolute start-full top-1/2 ms-4 w-14 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    회원 관리
                  </span>
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/auctions"
                  className="group relative flex justify-center rounded-sm px-2 py-1.5 hover:bg-gray-50"
                >
                  <NotebookText />
                  <span className="invisible absolute start-full top-1/2 ms-4 w-16 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    거래글 관리
                  </span>
                </Link>
              </li>

              <li>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="group relative flex justify-center rounded-sm px-3 py-1.5 hover:bg-gray-50"
                >
                  <Megaphone />

                  <span className="invisible absolute start-full top-1/2 ms-4 w-18.5 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
                    공지/경고 발송
                  </span>
                </button>
              </li>
              {isModalOpen &&
                createPortal(
                  <AdminAlarmPostModal onClose={() => setIsModalOpen(false)} />,
                  modalRoot
                )}
            </ul>
          </div>
        </nav>
      </div>

      <div className="sticky inset-x-0 bottom-0 border-t border-gray-100 bg-white p-2">
        <Link
          to="/admin/login"
          className="group relative flex w-full justify-center rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 opacity-75"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>

          <span className="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded-sm bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
            Logout
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminAsideMenu;
