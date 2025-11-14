import React, { useState, useEffect } from "react";
import AdminInquiryList from "../components/AdminInquiryList";
import {
  useInquiryList,
  type InquiryFilterParams,
} from "../hooks/useAdminDashboard";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

type FilterState = {
  type: "ALL" | "GENERAL" | "REPORT";
  status: "ALL" | "WAITING" | "COMPLETE";
  keywordType: "title" | "userEmail";
  keyword: string;
};

const createDefaultFilters = (): FilterState => ({
  type: "ALL",
  status: "ALL",
  keywordType: "title",
  keyword: "",
});

const AdmininquiryBoard = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(createDefaultFilters);
  const { inquiryList, pages, getInquiryList } = useInquiryList({ size: 10 });

  useEffect(() => {
    const query: InquiryFilterParams = {};
    if (appliedFilters.type !== "ALL") {
      query.type = appliedFilters.type;
    }
    if (appliedFilters.status !== "ALL") {
      query.status = appliedFilters.status;
    }
    const trimmedKeyword = appliedFilters.keyword.trim();
    if (trimmedKeyword) {
      if (appliedFilters.keywordType === "title") {
        query.title = trimmedKeyword;
      } else {
        query.userEmail = trimmedKeyword;
      }
    }

    getInquiryList(currentPage, 10, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters]);

  const applyFilterPatch = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setAppliedFilters((prev) => ({ ...prev, ...patch }));
    setCurrentPage(0);
  };

  const handlePrevPage = () => {
    if (pages && !pages.first) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pages && !pages.last) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleTypeChange = (value: FilterState["type"]) => {
    if (filters.type === value) return;
    applyFilterPatch({ type: value });
  };

  const handleStatusChange = (value: FilterState["status"]) => {
    if (filters.status === value) return;
    applyFilterPatch({ status: value });
  };

  const handleKeywordTypeChange = (value: FilterState["keywordType"]) => {
    setFilters((prev) => ({ ...prev, keywordType: value }));
  };

  const handleKeywordChange = (value: string) => {
    setFilters((prev) => ({ ...prev, keyword: value }));
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = filters.keyword.trim();
    if (filters.keyword !== trimmed) {
      setFilters((prev) => ({ ...prev, keyword: trimmed }));
    }
    setAppliedFilters((prev) => {
      if (
        prev.keyword === trimmed &&
        prev.keywordType === filters.keywordType &&
        prev.type === filters.type &&
        prev.status === filters.status
      ) {
        return prev;
      }
      return {
        ...prev,
        keyword: trimmed,
        keywordType: filters.keywordType,
        type: filters.type,
        status: filters.status,
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
    filters.type !== "ALL" ||
    filters.status !== "ALL" ||
    filters.keyword.trim().length > 0;

  return (
    <div>
      <h3 className="mb-4 font-bold text-gray-900">문의/신고 현황</h3>
      <div className="mt-4 mb-6 rounded-md bg-white px-1 pt-4 pb-1">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-700">문의 유형</span>
            {[
              { label: "전체", value: "ALL" as const },
              { label: "일반", value: "GENERAL" as const },
              { label: "신고", value: "REPORT" as const },
            ].map(({ label, value }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                  filters.type === value
                    ? "border-purple bg-purple text-white"
                    : "hover:border-purple/60 border-gray-300 text-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="inquiry-type"
                  value={value}
                  checked={filters.type === value}
                  onChange={() => handleTypeChange(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-700">답변 상태</span>
            {[
              { label: "전체", value: "ALL" as const },
              { label: "답변전", value: "WAITING" as const },
              { label: "답변완료", value: "COMPLETE" as const },
            ].map(({ label, value }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                  filters.status === value
                    ? "border-purple bg-purple text-white"
                    : "hover:border-purple/60 border-gray-300 text-gray-600"
                }`}
              >
                <input
                  type="radio"
                  name="inquiry-status"
                  value={value}
                  checked={filters.status === value}
                  onChange={() => handleStatusChange(value)}
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
            <span className="text-sm font-bold text-gray-700">문의 검색</span>
            <div className="relative">
              <select
                value={filters.keywordType}
                onChange={(e) =>
                  handleKeywordTypeChange(
                    e.target.value as FilterState["keywordType"]
                  )
                }
                className="focus:border-purple h-8 appearance-none rounded-md border border-gray-300 px-3 pr-8 text-sm text-gray-700 focus:outline-none"
              >
                <option value="title">제목</option>
                <option value="userEmail">작성자</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            </div>
            <input
              type="search"
              value={filters.keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder={
                filters.keywordType === "userEmail"
                  ? "이메일을 입력하세요"
                  : "제목을 입력하세요"
              }
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

      <AdminInquiryList inquiryList={inquiryList} />
      {pages && pages.totalPages > 0 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={pages.first}
            className={`p-1 transition-colors ${
              pages.first
                ? "cursor-not-allowed text-gray-300"
                : "hover:text-purple text-gray-600"
            }`}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-gray-700">
            <span className="text-purple font-semibold">
              {pages.currentPage + 1}
            </span>{" "}
            / {pages.totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pages.last}
            className={`p-1 transition-colors ${
              pages.last
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

export default AdmininquiryBoard;
