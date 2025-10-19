import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAuctions, type FetchAuctionsParams } from "../api/auctions";
import type { AuctionItem } from "../types/auctions";
import { useAuthStore } from "../../auth/store/authStore";

type UseAuctionSearchParams = Omit<FetchAuctionsParams, "page" | "size"> & {
  size?: number;
};

export const useAuctionSearch = ({
  searchKeyword,
  mainCategoryId,
  subCategoryId,
  minPrice,
  maxPrice,
  includeEnded,
  sortBy = "latest",
  size = 20,
}: UseAuctionSearchParams) => {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // 로그인 상태 키
  const authKey = useAuthStore((s) => s.userId ?? null);

  // 파라미터 바뀌면 초기화
  const sourceKey = useMemo(
    () =>
      JSON.stringify({
        searchKeyword: (searchKeyword ?? "").trim() || undefined,
        mainCategoryId,
        subCategoryId,
        minPrice,
        maxPrice,
        includeEnded,
        sortBy,
        size,
        authKey,
      }),
    [
      searchKeyword,
      mainCategoryId,
      subCategoryId,
      minPrice,
      maxPrice,
      includeEnded,
      sortBy,
      size,
      authKey,
    ]
  );

  useEffect(() => {
    setItems([]);
    setPage(0);
    setLast(false);
    setError(null);
    abortRef.current?.abort();
  }, [sourceKey]);

  useEffect(() => {
    if (last || loading) return;

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        const res = await fetchAuctions({
          searchKeyword: (searchKeyword ?? "").trim() || undefined,
          mainCategoryId: mainCategoryId ?? undefined,
          subCategoryId: subCategoryId ?? undefined,
          minPrice,
          maxPrice,
          includeEnded,
          sortBy,
          page,
          size,
        });
        setItems((prev) => (page === 0 ? res.data : [...prev, ...res.data]));
        setLast(res.last);
      } catch (e: any) {
        const canceled =
          e?.name === "CanceledError" || e?.code === "ERR_CANCELED";
        if (!canceled) setError("목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [
    searchKeyword,
    mainCategoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    includeEnded,
    sortBy,
    page,
    size,
    last,
    loading,
    authKey,
  ]);

  const loadMore = useCallback(() => {
    if (!loading && !last) setPage((p) => p + 1);
  }, [loading, last]);

  return { items, loading, error, last, loadMore, page, setPage, setItems };
};
