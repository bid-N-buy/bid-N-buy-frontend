// useSalePreview.ts
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
};

type AuctionListItem = {
  auctionId: number;
  title: string;
  mainImageUrl?: string;
  sellingStatus?: string;
  sellerNickname?: string;
  sellerId?: number | string;
};

export type UseSalePreviewOptions = {
  page?: number;
  size?: number;
  sort?: string;
  enabled?: boolean;
  ownerUserId?: string | number;
  ownerNickname?: string;

  /** 이 아이디들은 ONGOING 결과에서 무조건 빼버려 */
  excludeIds?: Array<string | number>;
};

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
    s.includes("END") ||
    s.includes("ENDED") ||
    s.includes("FINISH") ||
    s.includes("FINISHED") ||
    s.includes("DONE") ||
    s.includes("CLOSE") ||
    s.includes("CLOSED") ||
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

function parseListResponse<T>(data: T[] | { items?: T[]; total?: number }) {
  if (Array.isArray(data)) return { list: data, total: data.length };
  const list = data.items ?? [];
  const total = typeof data.total === "number" ? data.total : list.length;
  return { list, total };
}

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

        // COMPLETED 모드
        if (group === "COMPLETED") {
          if (viewingOther) {
            // 다른 유저 완료내역 아직 없음
            setItems([]);
            setCount(0);
            return;
          }

          const { data } = await api.get<
            MySaleItem[] | { items?: MySaleItem[]; total?: number }
          >("/mypage/sales", {
            params: { page, size, sort },
            signal: ctrl.signal,
          });

          const { list } = parseListResponse<MySaleItem>(data);

          const completedOnly = list.filter((it) =>
            isCompleted(
              normalizeState(it.sellingStatus ?? it.statusText ?? it.status)
            )
          );

          const mapped: PreviewItem[] = completedOnly.map((it) => ({
            id: it.auctionId,
            title: it.title,
            thumbnail: it.itemImageUrl ?? "",
          }));

          setItems(mapped.slice(0, size));
          setCount(completedOnly.length);
          return;
        }

        // ONGOING 모드
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
            a.sellerId != null ? String(a.sellerId) === wantId : false
          );

          if (byId.length > 0) {
            mineOnly = byId;
          } else if (ownerNickname) {
            mineOnly = allAuctions.filter(
              (a) => a.sellerNickname && a.sellerNickname === ownerNickname
            );
          }
        } else if (ownerNickname) {
          mineOnly = allAuctions.filter(
            (a) => a.sellerNickname && a.sellerNickname === ownerNickname
          );
        }

        // 진행중만 남기기 + 이미 완료된 애 강제 제외
        const ongoingOnly = mineOnly.filter((a) => {
          const st = normalizeState(a.sellingStatus);
          const notFinished = isOngoing(st) && !isCompleted(st);
          const notInCompletedList = !excludeIds
            .map(String)
            .includes(String(a.auctionId));
          return notFinished && notInCompletedList;
        });

        const mappedOngoing: PreviewItem[] = ongoingOnly.map((it) => ({
          id: it.auctionId,
          title: it.title,
          thumbnail: it.mainImageUrl ?? "",
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

    return () => ctrl.abort();
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
