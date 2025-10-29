// src/features/mypage/hooks/useSalePreview.ts
import { useEffect, useMemo, useState } from "react";
import api from "../../../shared/api/axiosInstance";

export type PreviewItem = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

// 우리가 화면에서 구분하는 두 가지 영역
export type PreviewGroup = "COMPLETED" | "ONGOING";

// 서버에서 내려온 상태 문자열을 내부적으로 분류
type SellingState =
  | "BEFORE" // 시작 전
  | "SALE" // 경매/판매중
  | "PROGRESS" // 낙찰 후 결제/배송중
  | "COMPLETED" // 거래완료
  | "UNKNOWN";

// /mypage/sales (완료/진행 포함 가능)
type MySaleItem = {
  auctionId: number;
  title: string;
  itemImageUrl?: string;
  statusText?: string; // 예: "결제 대기 중 (진행 중)"
  sellingStatus?: string; // 혹시 서버가 주면
  status?: string; // 혹시 서버가 주면
};

// /auctions (전체 경매 목록)
type AuctionListItem = {
  auctionId: number;
  title: string;
  mainImageUrl?: string;
  sellingStatus?: string; // 예: "시작전", "진행중", ...
  sellerNickname?: string;
  sellerId?: number | string; // ✅ 이 값이 오면 userId기반 필터 가능
};

export type UseSalePreviewOptions = {
  page?: number;
  size?: number;
  sort?: string;
  enabled?: boolean;

  /**
   * 특정 유저의 아이템만 보고 싶을 때 (다른 사람 프로필)
   * - undefined → "내 것" 모드
   * - "2" 같은 값 → 그 유저 것만 필터
   */
  ownerUserId?: string | number;

  /**
   * 내 닉네임(혹은 현재 로그인 유저 닉네임).
   * /auctions는 sellerNickname만 줄 수 있어서
   * sellerId가 아예 안 올 때 fallback 용도로 사용.
   */
  ownerNickname?: string;
};

/* 상태 문자열을 우리쪽 상태로 정규화 */
function normalizeState(raw?: string): SellingState {
  const s = (raw ?? "").trim().toUpperCase();

  // 시작 전 / 준비중
  if (
    [
      "BEFORE",
      "READY",
      "NOT_STARTED",
      "시작전",
      "시작 전",
      "경매전",
      "대기",
      "준비중",
    ].includes(s)
  ) {
    return "BEFORE";
  }

  // 경매/판매중
  if (
    [
      "SALE",
      "SELLING",
      "BIDDING",
      "진행중",
      "진행 중",
      "IN_PROGRESS",
      "RUNNING",
      "ON_SALE",
      "판매중",
    ].includes(s)
  ) {
    return "SALE";
  }

  // 낙찰 이후 처리중 (결제중, 배송중 등)
  if (
    [
      "PROGRESS",
      "결제중",
      "결제 중",
      "PAYMENT",
      "PAYMENT_PENDING",
      "배송중",
      "배송 중",
      "IN PROGRESS",
      "처리중",
    ].includes(s)
  ) {
    return "PROGRESS";
  }

  // 완전히 끝난 상태
  if (
    [
      "COMPLETED",
      "COMPLETE",
      "FINISH",
      "FINISHED",
      "DONE",
      "ENDED",
      "END",
      "CLOSED",
      "CLOSE",
      "경매 완료",
      "종료",
      "마감",
      "정산완료",
      "거래완료",
      "구매확정",
    ].includes(s)
  ) {
    return "COMPLETED";
  }

  return "UNKNOWN";
}

// 완료로 취급? → COMPLETED 만 true
const isCompleted = (st: SellingState) => st === "COMPLETED";

// 진행중으로 취급? → BEFORE / SALE / PROGRESS 만 true
const isOngoing = (st: SellingState) =>
  st === "BEFORE" || st === "SALE" || st === "PROGRESS";

/* 배열 or {items,total} 모두 대응 */
function parseListResponse<T>(data: T[] | { items?: T[]; total?: number }): {
  list: T[];
  total: number;
} {
  if (Array.isArray(data)) return { list: data, total: data.length };
  const list = data.items ?? [];
  const total = typeof data.total === "number" ? data.total : list.length;
  return { list, total };
}

/**
 * 핵심 훅:
 *  - group === "COMPLETED": 이미 끝난 거래들만 보여주고 count
 *  - group === "ONGOING": 아직 진행 중인 거래들만 보여주고 count
 *
 * 내 프로필일 땐:
 *   - COMPLETED은 /mypage/sales
 *   - ONGOING은 /auctions 중 sellerId === 내 id (또는 sellerNickname === 내 닉네임) && 진행중
 *
 * 다른 유저 프로필일 땐:
 *   - COMPLETED은 현재 백엔드에 상대방 완료내역 API 없으므로 비움
 *   - ONGOING은 /auctions 에서 sellerId === 그 사람 id (없으면 닉네임으로 fallback)
 */
export function useSalePreview(
  group: PreviewGroup,
  opts: UseSalePreviewOptions = {}
) {
  const {
    page = 0,
    size: sizeRaw = 3,
    sort = "end",
    enabled = true,
    ownerUserId, // ex) "2" (string) or 2 (number)
    ownerNickname,
  } = opts;

  const size = Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 0;

  const [items, setItems] = useState<PreviewItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState<boolean>(!!enabled);
  const [error, setError] = useState<unknown>(null);

  // 메모 키들 (의존성에서 객체 비교 대신 안정적으로 비교하려고 string화)
  const nickKey = useMemo(() => ownerNickname ?? "", [ownerNickname]);
  const ownerIdKey = useMemo(
    () => (ownerUserId !== undefined ? String(ownerUserId) : ""),
    [ownerUserId]
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

        // ── COMPLETED 섹션 ──────────────────────────────────
        if (group === "COMPLETED") {
          if (viewingOther) {
            // 상대 유저 완료내역은 아직 서버 API 없음 → 빈값
            setItems([]);
            setCount(0);
            return;
          }

          // 내 판매완료 내역
          const { data } = await api.get<
            MySaleItem[] | { items?: MySaleItem[]; total?: number }
          >("/mypage/sales", {
            params: { page, size, sort },
            signal: ctrl.signal,
          });

          const { list } = parseListResponse<MySaleItem>(data);

          // COMPLETED 상태만 추리기
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

        // ── ONGOING 섹션 ────────────────────────────────────
        const { data } = await api.get<{
          data: AuctionListItem[];
          totalElements?: number;
        }>("/auctions", {
          params: { page, size: 50, sort }, // 최대 50개만 한번에
          signal: ctrl.signal,
        });

        const allAuctions = Array.isArray(data.data) ? data.data : [];

        // 1차: sellerId와 ownerUserId 일치로 필터 (가장 정확)
        let mineOnly = allAuctions;
        if (ownerUserId != null) {
          const wantId = String(ownerUserId);
          const byId = allAuctions.filter((a) =>
            a.sellerId != null ? String(a.sellerId) === wantId : false
          );

          if (byId.length > 0) {
            mineOnly = byId;
          } else if (ownerNickname) {
            // 2차: sellerId가 없거나 매칭 실패 → 닉네임 fallback
            mineOnly = allAuctions.filter(
              (a) => a.sellerNickname && a.sellerNickname === ownerNickname
            );
          }
        } else if (ownerNickname) {
          // ownerUserId 자체가 없으면 내 페이지 상황이니까 닉네임 기준
          mineOnly = allAuctions.filter(
            (a) => a.sellerNickname && a.sellerNickname === ownerNickname
          );
        }

        // 진행중 상태만
        const ongoingOnly = mineOnly.filter((a) =>
          isOngoing(normalizeState(a.sellingStatus))
        );

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
    ownerIdKey, // ownerUserId 바뀌면 다시
    nickKey, // ownerNickname 바뀌면 다시
  ]);

  return { items, count, loading, error };
}
