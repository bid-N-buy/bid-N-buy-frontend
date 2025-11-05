// src/features/mypage/hooks/useSalePreview.ts
import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";

export type PreviewItem = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

export type PreviewGroup = "COMPLETED" | "ONGOING";

type SellingState = "BEFORE" | "SALE" | "PROGRESS" | "COMPLETED" | "UNKNOWN";

type MySaleItem = {
  auctionId: number;
  title: string;
  itemImageUrl?: string;
  statusText?: string;
  sellingStatus?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
};

type AuctionListItem = {
  auctionId: number;
  title: string;
  mainImageUrl?: string;
  // 서버마다 키가 다를 수 있어 any 허용
  [key: string]: any;
};

export type UseSalePreviewOptions = {
  page?: number;
  size?: number;
  sort?: string;
  enabled?: boolean;
  ownerUserId?: string | number;
  ownerNickname?: string;
  excludeIds?: Array<string | number>;
};

/* ============ 상태 정규화 ============ */
function normalizeState(raw?: string): SellingState {
  const s = (raw ?? "").trim().toUpperCase();

  if (
    s.includes("거래완료") ||
    s.includes("거래 완료") ||
    s.includes("구매확정") ||
    s.includes("구매 확정") ||
    s.includes("정산완료") ||
    s.includes("정산 완료") ||
    s.includes("마감") ||
    s.includes("종료") ||
    s.includes("경매 종료") ||
    s.includes("CLOSE") ||
    s.includes("CLOSED") ||
    s.includes("END") ||
    s.includes("ENDED") ||
    s.includes("FINISH") ||
    s.includes("FINISHED") ||
    s.includes("DONE") ||
    s.includes("COMPLETE") ||
    s.includes("COMPLETED")
  ) {
    return "COMPLETED";
  }

  if (
    s.includes("진행중") ||
    s.includes("진행 중") ||
    s.includes("판매중") ||
    s.includes("판매 중") ||
    s.includes("IN_PROGRESS") ||
    s.includes("IN PROGRESS") ||
    s.includes("RUNNING") ||
    s.includes("ON_SALE") ||
    s.includes("SALE") ||
    s.includes("BIDDING") ||
    s.includes("결제중") ||
    s.includes("결제 중") ||
    s.includes("결제대기") ||
    s.includes("결제 대기") ||
    s.includes("배송중") ||
    s.includes("배송 중") ||
    s.includes("PAYMENT") ||
    s.includes("PAYMENT_PENDING") ||
    s.includes("PROGRESS")
  ) {
    return "PROGRESS";
  }

  if (
    s.includes("시작전") ||
    s.includes("시작 전") ||
    s.includes("준비중") ||
    s.includes("준비 중") ||
    s.includes("대기") ||
    s.includes("READY") ||
    s.includes("NOT_STARTED") ||
    s.includes("BEFORE")
  ) {
    return "BEFORE";
  }

  return "UNKNOWN";
}

const isCompleted = (st: SellingState) => st === "COMPLETED";
const isOngoing = (st: SellingState) =>
  st === "BEFORE" || st === "SALE" || st === "PROGRESS";

/* ============ 보강 유틸 ============ */
// 날짜 문자열이 여러 포맷/키로 올 수 있으니 안전 추출
const getEndTimeStr = (obj: any): string | undefined => {
  return (
    obj?.endTime ??
    obj?.end_at ??
    obj?.endAt ??
    obj?.auctionEnd ??
    obj?.auctionEndTime ??
    obj?.auction_end_time ??
    obj?.end ??
    undefined
  );
};

// 상태 문자열도 키가 다를 수 있음
const getStatusStr = (obj: any): string | undefined => {
  return (
    obj?.sellingStatus ??
    obj?.status ??
    obj?.statusText ??
    obj?.selling_status ??
    obj?.status_text ??
    undefined
  );
};

// ✅ 시간 기반 보정: endTime이 현재 시각 이전이면 완료로 간주
const isFinishedByTime = (end?: string) => {
  if (!end) return false;
  // 프로덕션에서 '2025.11.01 14:30' 같은 포맷이 오면 Date 파싱이 NaN 될 수 있음.
  // 숫자만 추출해서 YYYY-MM-DDTHH:MM:SS 형태로 보정 시도
  let t = Date.parse(end);
  if (!Number.isFinite(t)) {
    const cleaned = end.replace(/\./g, "-").replace(/\s/, "T"); // '2025.11.01 14:30' -> '2025-11-01T14:30'
    t = Date.parse(cleaned);
  }
  return Number.isFinite(t) && t <= Date.now();
};

function parseListResponse<T>(data: T[] | { items?: T[]; total?: number }) {
  if (Array.isArray(data)) return { list: data, total: data.length };
  const list = data.items ?? [];
  const total = typeof data.total === "number" ? data.total : list.length;
  return { list, total };
}

/* ============ 훅 ============ */
export function useSalePreview(
  group: PreviewGroup,
  opts: UseSalePreviewOptions = {}
) {
  const {
    page = 0,
    size: sizeRaw = 3,
    sort = "end",
    enabled = true,
    ownerUserId,
    ownerNickname,
    excludeIds = [],
  } = opts;

  const size = Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 0;

  const [items, setItems] = useState<PreviewItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState<boolean>(!!enabled);
  const [error, setError] = useState<unknown>(null);

  const nickKey = useMemo(() => ownerNickname ?? "", [ownerNickname]);
  const ownerIdKey = useMemo(
    () => (ownerUserId !== undefined ? String(ownerUserId) : ""),
    [ownerUserId]
  );
  const excludeKey = useMemo(
    () => excludeIds.map(String).sort().join("|"),
    [excludeIds]
  );

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const viewingOther = ownerUserId !== undefined;

        // =========================
        // ✅ COMPLETED 프리뷰
        // =========================
        if (group === "COMPLETED") {
          // ---- 타인 프로필: /auctions 재사용 후 '완료' 필터 ----
          if (viewingOther && ownerUserId != null) {
            const fetchAndFilter = async (bulkSize: number) => {
              const { data } = await api.get<{
                data: AuctionListItem[];
                totalElements?: number;
              }>("/auctions", {
                params: { page, size: bulkSize, sort },
                signal: ctrl.signal,
              });

              const all = Array.isArray(data?.data) ? data.data : [];

              const completed = all.filter((a) => {
                const sellerMatch =
                  a?.sellerId != null &&
                  String(a.sellerId) === String(ownerUserId);

                // 상태 or 시간으로 완료 판단
                const st = normalizeState(getStatusStr(a));
                const byState = isCompleted(st);
                const byTime = isFinishedByTime(getEndTimeStr(a));

                // winnerNickname 존재 같은 힌트도 보조(있으면 거의 완료)
                const byWinner =
                  typeof a?.winnerNickname === "string" &&
                  a.winnerNickname.length > 0;

                return sellerMatch && (byState || byTime || byWinner);
              });

              return completed.map<PreviewItem>((it) => ({
                id: it.auctionId,
                title: it.title,
                thumbnail: it.mainImageUrl ?? it.itemImageUrl ?? "",
              }));
            };

            // 1차 50개, 0건이면 2차 200개로 재시도 (프로덕션 정렬/필터 차이 대비)
            let mapped = await fetchAndFilter(50);
            if (mapped.length === 0) {
              try {
                mapped = await fetchAndFilter(200);
              } catch (_) {
                /* ignore second attempt error */
              }
            }

            setItems(mapped.slice(0, size));
            setCount(mapped.length);
            return;
          }

          // ---- 내 프로필: /mypage/sales 사용 + 보정 ----
          const { data } = await api.get<
            MySaleItem[] | { items?: MySaleItem[]; total?: number }
          >("/mypage/sales", {
            params: { page, size, sort },
            signal: ctrl.signal,
          });

          const { list } = parseListResponse<MySaleItem>(data);

          const completedOnly = list.filter((it) => {
            const st = normalizeState(
              it.sellingStatus ?? it.statusText ?? it.status
            );
            const byState = isCompleted(st);
            const byTime = isFinishedByTime(it.endTime);
            // winnerNickname 있으면 완료로 간주
            const byWinner =
              typeof (it as any)?.winnerNickname === "string" &&
              (it as any).winnerNickname.length > 0;
            return byState || byTime || byWinner;
          });

          const mapped: PreviewItem[] = completedOnly.map((it) => ({
            id: it.auctionId,
            title: it.title,
            thumbnail: it.itemImageUrl ?? "",
          }));

          setItems(mapped.slice(0, size));
          setCount(completedOnly.length);
          return;
        }

        // =========================
        // ✅ ONGOING 프리뷰 (기존 로직 유지)
        // =========================
        const { data } = await api.get<{
          data: AuctionListItem[];
          totalElements?: number;
        }>("/auctions", {
          params: { page, size: 50, sort },
          signal: ctrl.signal,
        });

        const allAuctions = Array.isArray(data.data) ? data.data : [];

        // 내 것 / 타인 것 필터
        let mineOnly = allAuctions;
        if (ownerUserId != null) {
          const wantId = String(ownerUserId);
          const byId = allAuctions.filter((a) =>
            a?.sellerId != null ? String(a.sellerId) === wantId : false
          );

          if (byId.length > 0) {
            mineOnly = byId;
          } else if (ownerNickname) {
            mineOnly = allAuctions.filter(
              (a) => a?.sellerNickname && a.sellerNickname === ownerNickname
            );
          }
        } else if (ownerNickname) {
          mineOnly = allAuctions.filter(
            (a) => a?.sellerNickname && a.sellerNickname === ownerNickname
          );
        }

        // 진행중만 남기기 + 이미 완료된 애 강제 제외
        const ongoingOnly = mineOnly.filter((a) => {
          const st = normalizeState(getStatusStr(a));
          const notFinished = isOngoing(st) && !isCompleted(st);
          const notInCompletedList = !excludeIds
            .map(String)
            .includes(String(a.auctionId));
          return notFinished && notInCompletedList;
        });

        const mappedOngoing: PreviewItem[] = ongoingOnly.map((it) => ({
          id: it.auctionId,
          title: it.title,
          thumbnail: it.mainImageUrl ?? it.itemImageUrl ?? "",
        }));

        setItems(mappedOngoing.slice(0, size));
        setCount(ongoingOnly.length);
      } catch (e: any) {
        if (e?.name === "CanceledError") return;
        setError(e);
      } finally {
        setLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    group,
    page,
    size,
    sort,
    enabled,
    ownerIdKey,
    nickKey,
    excludeKey, // excludeIds 변하면 다시 계산
  ]);

  return { items, count, loading, error };
}
