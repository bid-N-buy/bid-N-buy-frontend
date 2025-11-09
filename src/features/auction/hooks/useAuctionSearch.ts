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

  // 초기 로드 완료 여부 추적(무한스크롤 때문에)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // 최고가(가격 필터 상한)
  const [topPrice, setTopPrice] = useState<number>(1_000_000);
  const topAbortRef = useRef<AbortController | null>(null);

  // 진행 중인 목록 요청 관리
  const abortRef = useRef<AbortController | null>(null);

  // 이전 소스 키
  const prevSourceKeyRef = useRef<string>("");

  // 로그인 상태 키
  const authKey = useAuthStore((s) => s.userId ?? null);

  // 파라미터 바뀌면 초기화 키
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

  // sourceKey 변경 시 초기화
  useEffect(() => {
    setItems([]);
    setPage(0);
    setLast(false);
    setError(null);
    setLoading(false);
    setInitialLoadComplete(false); // 초기 로드 완료 상태 리셋
    // 진행 중인 요청 있음 취소하고 핸들러 비움
    abortRef.current?.abort();
    abortRef.current = null;
  }, [sourceKey]);

  // sourceKey 변경 시 초기 로드(page=0)
  useEffect(() => {
    const isSourceKeyChanged = prevSourceKeyRef.current !== sourceKey;
    if (!isSourceKeyChanged || last) return;

    // 진행 중이면 취소하고 새 컨트롤러 교체
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        const res = await fetchAuctions(
          {
            searchKeyword: (searchKeyword ?? "").trim() || undefined,
            mainCategoryId: mainCategoryId ?? undefined,
            subCategoryId: subCategoryId ?? undefined,
            minPrice,
            maxPrice,
            includeEnded,
            sortBy,
            page: 0,
            size,
          },
          controller.signal
        );
        prevSourceKeyRef.current = sourceKey;
        setItems(res.data);
        setLast(res.last);
        setInitialLoadComplete(true); // 초기 로드 완료 표시
      } catch (e: any) {
        const canceled =
          e?.name === "CanceledError" ||
          e?.code === "ERR_CANCELED" ||
          e?.name === "AbortError" ||
          (e instanceof Error && e.name === "AbortError");
        if (!canceled) setError("목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [
    searchKeyword,
    mainCategoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    includeEnded,
    sortBy,
    size,
    authKey,
    sourceKey,
    last,
  ]);

  // 무한스크롤 처리
  // page>0 로드
  useEffect(() => {
    // 초기 로드 완료 안 됐음 대기
    if (!initialLoadComplete) return;
    if (last || page === 0) return;

    // 진행 중이면 취소하고 새 컨트롤러 교체
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        const res = await fetchAuctions(
          {
            searchKeyword: (searchKeyword ?? "").trim() || undefined,
            mainCategoryId: mainCategoryId ?? undefined,
            subCategoryId: subCategoryId ?? undefined,
            minPrice,
            maxPrice,
            includeEnded,
            sortBy,
            page,
            size,
          },
          controller.signal
        );
        setItems((prev) => [...prev, ...res.data]);
        setLast(res.last);
      } catch (e: any) {
        const canceled =
          e?.name === "CanceledError" ||
          e?.code === "ERR_CANCELED" ||
          e?.name === "AbortError" ||
          (e instanceof Error && e.name === "AbortError");
        if (!canceled) setError("목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [
    page,
    initialLoadComplete,
    sourceKey,
    searchKeyword,
    mainCategoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    includeEnded,
    sortBy,
    size,
    authKey,
    last,
  ]);

  // 가격 필터 외 동일 조건으로 최고가 1건 조회 -> topPrice
  useEffect(() => {
    const controller = new AbortController();
    topAbortRef.current?.abort();
    topAbortRef.current = controller;

    (async () => {
      try {
        const res = await fetchAuctions(
          {
            searchKeyword: (searchKeyword ?? "").trim() || undefined,
            mainCategoryId: mainCategoryId ?? undefined,
            subCategoryId: subCategoryId ?? undefined,
            includeEnded,
            sortBy: "price_desc",
            page: 0,
            size: 1,
          },
          controller.signal
        );

        const top = res?.data?.[0];
        const ceil = top
          ? Math.max(1000, Number(top.currentPrice) || 0)
          : 1_000_000;
        setTopPrice(ceil);
      } catch (e: any) {
        const canceled =
          e?.name === "CanceledError" ||
          e?.code === "ERR_CANCELED" ||
          e?.name === "AbortError" ||
          (e instanceof Error && e.name === "AbortError");
        if (!canceled) setTopPrice(1_000_000); // 실패 시 기본값 100만 원으로
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
