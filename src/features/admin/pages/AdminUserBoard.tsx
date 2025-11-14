import React, { useState, useEffect } from "react";
import { useUserList, type UserFilterParams } from "../hooks/useAdminDashboard";
import AdminUserList from "../components/AdminUserList";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminManageUser } from "../types/AdminType";

type FilterState = {
  activityStatus: "ALL" | "활동" | "정지" | "DELETED_OR_BANNED";
  email: string;
};

const createDefaultFilters = (): FilterState => ({
  activityStatus: "ALL",
  email: "",
});

const AdminUserBoard = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(createDefaultFilters);
  const { getUserList } = useUserList({ size: 10 });
  const [filteredUserList, setFilteredUserList] = useState<AdminManageUser[]>(
    []
  );
  const [filteredPages, setFilteredPages] = useState<
    | {
        currentPage: number;
        totalPages: number;
        totalElements: number;
        pageSize: number;
        first: boolean;
        last: boolean;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const loadData = async () => {
      const trimmedEmail = appliedFilters.email.trim();
      const query: UserFilterParams = {};
      if (trimmedEmail) {
        query.email = trimmedEmail;
      }

      // 모든 데이터 받아온 후 필터링
      const result = await getUserList(0, 10000, query); // 일단 큰 size로 모든 데이터 가져오기
      if (!result) return;

      let filtered: AdminManageUser[] = [];

      if (appliedFilters.activityStatus === "DELETED_OR_BANNED") {
        // "탈퇴"랑 "강퇴" 다 포함
        filtered = result.data.filter(
          (user) =>
            user.activityStatus === "탈퇴" || user.activityStatus === "강퇴"
        );
      } else if (appliedFilters.activityStatus !== "ALL") {
        filtered = result.data.filter(
          (user) => user.activityStatus === appliedFilters.activityStatus
        );
      } else {
        filtered = result.data;
      }

      // 페이지네이션 - 필터링된 결과 기준으로 계산
      const pageSize = 10;
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const paginated = filtered.slice(startIndex, endIndex);
      const totalPages = Math.ceil(filtered.length / pageSize);
      const totalElements = filtered.length;

      setFilteredUserList(paginated);
      setFilteredPages({
        currentPage,
        totalPages,
        totalElements,
        pageSize,
        first: currentPage === 0,
        last: currentPage >= totalPages - 1,
      });
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters]);

  const applyFilterPatch = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setAppliedFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(0);
  };

  const handlePrevPage = () => {
    if (filteredPages && !filteredPages.first) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (filteredPages && !filteredPages.last) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleActivityStatusChange = (value: FilterState["activityStatus"]) => {
    if (filters.activityStatus === value) return;
    applyFilterPatch({ activityStatus: value });
  };

  const handleEmailChange = (value: string) => {
    setFilters((prev) => ({ ...prev, email: value }));
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = filters.email.trim();
    if (filters.email !== trimmed) {
      setFilters((prev) => ({ ...prev, email: trimmed }));
    }
    setAppliedFilters((prev) => {
      if (
        prev.email === trimmed &&
        prev.activityStatus === filters.activityStatus
      ) {
        return prev;
      }
      return {
        ...prev,
        email: trimmed,
        activityStatus: filters.activityStatus,
      };
    });
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    const defaults = createDefaultFilters();
    setFilters(defaults);
    setAppliedFilters(defaults);
    setCurrentPage(0);
  };

  const isFilterDirty =
    filters.activityStatus !== "ALL" || filters.email.trim().length > 0;

  return (
    <div>
      <h3 className="mb-4 font-bold text-gray-900">회원 관리</h3>
      <div className="mt-4 mb-6 rounded-md bg-white px-1 pt-4 pb-1">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-700">활동 상태</span>
            {[
              { label: "전체", value: "ALL" as const },
              { label: "활동", value: "활동" as const },
              { label: "정지", value: "정지" as const },
              { label: "탈퇴/강퇴", value: "DELETED_OR_BANNED" as const },
            ].map(({ label, value }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                  filters.activityStatus === value
                    ? "border-purple bg-purple text-white"
                    : "hover:border-purple/60 border-gray-300 text-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="activity-status"
                  value={value}
                  checked={filters.activityStatus === value}
                  onChange={() => handleActivityStatusChange(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-center gap-3"
          >
            <span className="text-sm font-bold text-gray-700">회원 검색</span>
            <input
              type="search"
              value={filters.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="focus:border-purple h-8 w-56 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-purple hover:bg-deep-purple h-8 min-w-[64px] rounded-md px-4 text-sm font-semibold text-white transition-colors"
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!isFilterDirty}
              className={`h-8 min-w-[64px] rounded-md px-4 text-sm transition-colors ${
                isFilterDirty
                  ? "hover:border-purple hover:text-purple border border-gray-300 text-gray-600"
                  : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
              }`}
            >
              초기화
            </button>
          </form>
        </div>
      </div>

      <AdminUserList userList={filteredUserList} />
      {filteredPages && filteredPages.totalPages > 0 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={filteredPages.first}
            className={`p-1 transition-colors ${
              filteredPages.first
                ? "cursor-not-allowed text-gray-300"
                : "hover:text-purple text-gray-600"
            }`}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-gray-700">
            <span className="text-purple font-semibold">
              {filteredPages.currentPage + 1}
            </span>{" "}
            / {filteredPages.totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={filteredPages.last}
            className={`p-1 transition-colors ${
              filteredPages.last
                ? "cursor-not-allowed text-gray-300"
                : "hover:text-purple text-gray-600"
            }`}
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUserBoard;
