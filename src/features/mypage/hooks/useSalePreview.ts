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
   * /auctions는 sellerNickname만 주기 때문에
   * 내 것만 고르려면 필요함.
   * 다른 유저 프로필일 땐 그 유저 닉네임 넣어주면 됨.
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
 *   - ONGOING은 /auctions 중에서 sellerNickname === 내 닉네임 && 진행중만
 *
 * 다른 유저 프로필일 땐:
 *   - 아직 백엔드 특정 유저 전용 API 없음 → 임시로 /auctions 불러서 sellerNickname === 그 유저 닉네임 으로만 ONGOING,
 *     COMPLETED은 아직 없으니까 빈 배열로 (0건)
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
    ownerUserId,
    ownerNickname,
  } = opts;

  const size = Number.isFinite(sizeRaw) && sizeRaw > 0 ? sizeRaw : 0;

  const [items, setItems] = useState<PreviewItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState<boolean>(!!enabled);
  const [error, setError] = useState<unknown>(null);

  // nickname은 의존성으로 쓰일 수 있으니까 메모 키로
  const nickKey = useMemo(() => ownerNickname ?? "", [ownerNickname]);

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

        // ⚠️ 다른 유저 프로필일 때: ownerUserId 가 정의돼 있다
        const viewingOther = ownerUserId !== undefined;

        // ───────── COMPLETED 섹션 ─────────
        if (group === "COMPLETED") {
          if (viewingOther) {
            // 지금은 상대방의 "완료 거래"용 API가 명확히 없다고 했으니
            // 일단 빈값 처리
            setItems([]);
            setCount(0);
            return;
          }

          // 내 판매완료 내역: /mypage/sales
          const { data } = await api.get<
            MySaleItem[] | { items?: MySaleItem[]; total?: number }
          >("/mypage/sales", {
            params: { page, size, sort },
            signal: ctrl.signal,
          });

          const { list } = parseListResponse<MySaleItem>(data);

          // COMPLETED 인 것만 추림
          const completedOnly = list.filter((it) =>
            isCompleted(
              normalizeState(it.sellingStatus ?? it.statusText ?? it.status)
            )
          );

          // PreviewItem 형태로 매핑
          const mapped: PreviewItem[] = completedOnly.map((it) => ({
            id: it.auctionId,
            title: it.title,
            thumbnail: it.itemImageUrl ?? "",
          }));

          setItems(mapped.slice(0, size));
          setCount(completedOnly.length);
          return;
        }

        // ───────── ONGOING 섹션 ─────────
        // 진행중은 /auctions 전체에서 sellerNickname 필터
        const { data } = await api.get<{
          data: AuctionListItem[];
          totalElements?: number;
          // ... 기타 페이지 정보
        }>("/auctions", {
          params: { page, size: 50, sort }, // 넉넉히 50개만 끊어서 불러옴
          signal: ctrl.signal,
        });

        const allAuctions = Array.isArray(data.data) ? data.data : [];

        // 닉네임 기준으로 내가 올린(or 상대가 올린) 것만
        const mineOnly = ownerNickname
          ? allAuctions.filter(
              (a) => a.sellerNickname && a.sellerNickname === ownerNickname
            )
          : allAuctions;

        // 그 중에서 "진행중(또는 경매전/결제중 등 아직 안 끝난)" 상태만
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
    ownerUserId,
    nickKey, // nickname이 바뀌면 다시 로드
  ]);

  return { items, count, loading, error };
}
