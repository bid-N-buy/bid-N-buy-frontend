// src/features/mypage/hooks/useSalePreview.ts
import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";

/** 프리뷰용 아이템 */
export type PreviewItem = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

type Group = "DONE" | "BIDDING";

/** 서버 enum(의도한 상태 묶음) */
type SellingEnum = "BEFORE" | "SALE" | "COMPLETED" | "PROGRESS" | "FINISH";

/** 완료 목록(/mypage/sales) 아이템 (필요 필드만) */
type DoneListItem = {
  auctionId: number;
  title: string;
  itemImageUrl?: string;
};

/** 진행 목록(목록형 엔드포인트) 아이템 (필요 필드만) */
type OngoingListItem = {
  auctionId: number;
  title: string;
  thumbnail?: string;
  sellingStatus?: string; // 서버가 주면 사용
  status?: string; // 다른 필드명 대응
};

type Options = {
  /** 진행/경매전 아이템 id 배열이 있다면 전달 → /auctions/{id} 상세로 뽑음 */
  ongoingIds?: number[];
  /** 진행중 목록형 엔드포인트가 있다면 지정(없으면 시도 X). 예: "/mypage/my-auctions" */
  ongoingListEndpoint?: string;
  /** 완료 목록 엔드포인트 (기본: "/mypage/sales") */
  doneListEndpoint?: string;
  /** 프리뷰 페이지/개수/정렬 */
  page?: number;
  size?: number; // 프리뷰 최대 개수(기본 3)
  sort?: string; // 예: "end"
};

/* ---------------------------
 * 유틸: 상태 정규화 & 매핑
 * --------------------------- */
function normalizeStatus(raw?: string): SellingEnum | "UNKNOWN" {
  const s = (raw ?? "").toUpperCase().trim();
  if (["BEFORE", "경매전", "경매 전", "READY", "NOT_STARTED"].includes(s))
    return "BEFORE";
  if (
    [
      "SALE",
      "진행 중",
      "IN_PROGRESS",
      "RUNNING",
      "ON_SALE",
      "BIDDING",
    ].includes(s)
  )
    return "SALE";
  if (
    ["PROGRESS", "결제 중", "결재 중", "PAYMENT", "PAYMENT_PENDING"].includes(s)
  )
    return "PROGRESS";
  if (
    [
      "COMPLETED",
      "FINISH",
      "경매 완료",
      "종료",
      "ENDED",
      "CLOSED",
      "DONE",
    ].includes(s)
  )
    return "COMPLETED";
  return "UNKNOWN";
}

/** 그룹 → 서버 enum 묶음 */
function groupToEnums(g: Group): SellingEnum[] {
  return g === "BIDDING"
    ? ["BEFORE", "SALE"]
    : ["COMPLETED", "PROGRESS", "FINISH"];
}

/** 배열/객체 응답 모두 대응하는 안전 파서 */
function parseListResponse<T extends object>(
  data: T[] | { items?: T[]; total?: number }
): { list: T[]; total: number } {
  if (Array.isArray(data)) return { list: data, total: data.length };
  const list = data.items ?? [];
  const total = typeof data.total === "number" ? data.total : list.length;
  return { list, total };
}

/* ---------------------------
 * 메인 훅
 * --------------------------- */
export function useSalePreview(status: Group, opts: Options = {}) {
  const {
    ongoingIds = [],
    ongoingListEndpoint,
    doneListEndpoint = "/mypage/sales",
    page = 0,
    size = 3,
    sort = "end",
  } = opts;

  const [items, setItems] = useState<PreviewItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // 의존성 안정화(배열 비교 최적화)
  const idsKey = useMemo(() => ongoingIds.join(","), [ongoingIds]);

  useEffect(() => {
    const ctrl = new AbortController(); // 언마운트/재호출 시 요청 취소
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (status === "DONE") {
          // ✅ 완료/결제중/종료 묶음: /mypage/sales
          const { data } = await api.get<
            DoneListItem[] | { items: DoneListItem[]; total?: number }
          >(doneListEndpoint, {
            params: { page, size, sort },
            signal: ctrl.signal,
          });
          const { list, total } = parseListResponse<DoneListItem>(data);

          const mapped: PreviewItem[] = list.map((it) => ({
            id: it.auctionId,
            title: it.title,
            thumbnail: it.itemImageUrl ?? "",
          }));

          setItems(mapped.slice(0, size));
          setCount(total);
          return;
        }

        // ✅ 진행/경매전(= BEFORE/SALE)
        const targets = groupToEnums(status); // ["BEFORE","SALE"]
        let ongoing: PreviewItem[] = [];
        let total = 0;

        if (ongoingIds.length > 0) {
          // 1) id 배열이 있으면 /auctions/{id} 상세에서 상태 확인(정규화 후 필터)
          const settled = await Promise.allSettled(
            ongoingIds.map(async (id) => {
              const { data } = await api.get<any>(`/auctions/${id}`, {
                signal: ctrl.signal,
              });
              const norm = normalizeStatus(data?.sellingStatus);
              if (!targets.includes(norm as SellingEnum)) return null;
              const thumb =
                data?.images?.find((i: any) => i.imageType === "MAIN")
                  ?.imageUrl ??
                data?.images?.[0]?.imageUrl ??
                "";
              return {
                id: data?.auctionId ?? id,
                title: data?.title ?? "",
                thumbnail: thumb,
              } as PreviewItem;
            })
          );

          const list = settled
            .map((r) => (r.status === "fulfilled" ? r.value : null))
            .filter(Boolean) as PreviewItem[];

          // 중복 제거(동일 id 보호)
          const uniq = Array.from(new Map(list.map((x) => [x.id, x])).values());
          ongoing = uniq;
          total = uniq.length;
        } else if (ongoingListEndpoint) {
          // 2) 진행중 목록형 엔드포인트가 있으면 서버에 위임(권장)
          const { data } = await api.get<
            OngoingListItem[] | { items?: OngoingListItem[]; total?: number }
          >(ongoingListEndpoint, {
            params: { page, size, statuses: "BEFORE,SALE" },
            signal: ctrl.signal,
          });

          const { list, total: t } = parseListResponse<OngoingListItem>(data);

          const mapped: PreviewItem[] = list
            .filter((x) =>
              targets.includes(
                normalizeStatus(x.sellingStatus ?? x.status) as SellingEnum
              )
            )
            .map((x) => ({
              id: x.auctionId,
              title: x.title,
              thumbnail: x.thumbnail ?? "",
            }));

          // 중복 제거
          ongoing = Array.from(new Map(mapped.map((x) => [x.id, x])).values());
          total = t;
        } else {
          // 진행중을 얻을 수단이 없으면 빈 값
          ongoing = [];
          total = 0;
        }

        setItems(ongoing.slice(0, size));
        setCount(total);
      } catch (e: any) {
        if (e?.name === "CanceledError") return; // 취소는 무시
        setError(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [status, page, size, sort, idsKey, ongoingListEndpoint, doneListEndpoint]);

  return { items, count, loading, error };
}
