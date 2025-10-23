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

  // 최고가(가격 필터 상한)
  const [topPrice, setTopPrice] = useState<number>(500_000);
  const topAbortRef = useRef<AbortController | null>(null);

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

  // 가격 필터 외 동일 조건으로 최고가 1건 조회 -> topPrice
  useEffect(() => {
    const controller = new AbortController();
    topAbortRef.current?.abort();
    topAbortRef.current = controller;

    (async () => {
      try {
        const res = await fetchAuctions({
          searchKeyword: (searchKeyword ?? "").trim() || undefined,
          mainCategoryId: mainCategoryId ?? undefined,
          subCategoryId: subCategoryId ?? undefined,
          includeEnded,
          sortBy: "price_desc",
          page: 0,
          size: 1,
        });

        const top = res?.data?.[0];
        const ceil = top
          ? Math.max(1000, Number(top.currentPrice) || 0)
          : 500_000;
        setTopPrice(ceil);
      } catch (e: any) {
        const canceled =
          e?.name === "CanceledError" || e?.code === "ERR_CANCELED";
        if (!canceled) setTopPrice(500_000); // 실패 시 기본값
      }
    })();

    return () => controller.abort();
  }, [searchKeyword, mainCategoryId, subCategoryId, includeEnded, authKey]);

  const loadMore = useCallback(() => {
    if (!loading && !last) setPage((p) => p + 1);
  }, [loading, last]);

  return {
    items,
    loading,
    error,
    last,
    loadMore,
    page,
    setPage,
    setItems,
    topPrice,
  };
};

// 훅에 데이터 책임 집중
