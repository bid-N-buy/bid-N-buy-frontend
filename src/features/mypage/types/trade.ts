export type TradeKind = "purchase" | "sale";

export type TradeStatus =
  | "BEFORE" // 등록 전/비공개
  | "SALE" // 판매 중(입찰 가능)
  | "COMPLETED" // 거래 완료
  | "PROGRESS" // 결제/배송/정산 등 진행 중
  | "FINISH"; // 경매/판매 종료(더 이상 입찰 X)

// 화면 공통 표준 모델 (단일 소스)
export type TradeItem = {
  id: string; // 공통 id (문자열 권장)
  title: string;
  thumbUrl?: string | null;
  price?: number;
  status: TradeStatus;
  statusText?: string;
  counterparty?: string; // 구매면 판매자, 판매면 구매자(혹은 "meAsSeller")
  auctionStart?: string; // ISO
  auctionEnd?: string; // ISO
};

/* -------------------------
 *   서버 응답 (변환 전)
 * ------------------------- */

// 구매 탭 API 예시
export type ApiPurchase = {
  id: number;
  itemName: string;
  seller: string;
  thumbnail: string;
  status: string; // 서버: BEFORE/SALE/COMPLETED/PROGRESS/FINISH
  startAt?: string; // ISO
  endAt?: string; // ISO
};

// 판매 탭 API 예시
export type ApiSale = {
  id: number;
  title: string;
  meAsSeller: string;
  image: string;
  status: string; // 서버: BEFORE/SALE/COMPLETED/PROGRESS/FINISH
  startAt?: string;
  endAt?: string;
};

/* =========================
 *     Status Utilities
 * ========================= */

// 상태 문자열을 안전하게 정규화
export const toStatus = (raw?: string): TradeStatus => {
  if (!raw) return "FINISH"; // 기본값(안전하게 종료로 처리)
  const u = raw.trim().toUpperCase();
  switch (u) {
    case "BEFORE":
    case "SALE":
    case "COMPLETED":
    case "PROGRESS":
    case "FINISH":
      return u;
    default:
      return "FINISH";
  }
};

// 화면 표기 라벨
export const STATUS_LABEL: Record<TradeStatus, string> = {
  BEFORE: "등록 전",
  SALE: "판매 중",
  PROGRESS: "진행 중",
  COMPLETED: "거래 완료",
  FINISH: "종료됨",
};

// 상태 정렬 우선순위 (작을수록 먼저)
export const STATUS_ORDER: Record<TradeStatus, number> = {
  // 진행건을 상단에: SALE(0) → PROGRESS(1) → BEFORE(2) → FINISH(3) → COMPLETED(4)
  SALE: 0,
  PROGRESS: 1,
  BEFORE: 2,
  FINISH: 3,
  COMPLETED: 4,
};

// 종료시간 기반 보조 판정 (end가 과거면 종료 취급)
export const isEndedByTime = (endAt?: string): boolean => {
  if (!endAt) return false;
  const end = new Date(endAt).getTime();
  return Number.isFinite(end) ? end <= Date.now() : false;
};

// 진행/종료 여부 (상태 + 시간 모두 고려)
export const isOngoing = (
  item: Pick<TradeItem, "status" | "auctionEnd">
): boolean => {
  // 시간상 이미 지났으면 종료
  if (isEndedByTime(item.auctionEnd)) return false;
  // 상태상 진행으로 보는 값
  return (
    item.status === "SALE" ||
    item.status === "PROGRESS" ||
    item.status === "BEFORE"
  );
};

export const isEnded = (
  item: Pick<TradeItem, "status" | "auctionEnd">
): boolean => {
  if (isEndedByTime(item.auctionEnd)) return true;
  return item.status === "FINISH" || item.status === "COMPLETED";
};

// 정렬 헬퍼: 진행 우선 → 종료 뒤로, 종료 내에서는 종료시각 최근순
export const compareTradeItems = (a: TradeItem, b: TradeItem): number => {
  // 1) 상태 우선순위
  const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (so !== 0) return so;

  // 2) 동일 그룹이면 종료시각 내림차순(최근 종료가 위)
  const ta = a.auctionEnd ? new Date(a.auctionEnd).getTime() : 0;
  const tb = b.auctionEnd ? new Date(b.auctionEnd).getTime() : 0;
  return tb - ta;
};

// 잔여 시간 텍스트 (예: "1시간 20분 남음" / "종료")
export const timeLeftLabel = (endAt?: string): string => {
  if (!endAt) return "";
  const end = new Date(endAt).getTime();
  const diff = end - Date.now();
  if (!Number.isFinite(end) || diff <= 0) return "종료";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}분 남음`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}시간 ${rm}분 남음`;
};

/* =========================
 *     API → 표준 모델
 * ========================= */

export const fromPurchase = (r: ApiPurchase): TradeItem => {
  const status = toStatus(r.status);
  return {
    id: String(r.id),
    title: r.itemName,
    thumbUrl: r.thumbnail,
    status,
    statusText: STATUS_LABEL[status],
    counterparty: r.seller,
    auctionStart: r.startAt,
    auctionEnd: r.endAt,
  };
};

export const fromSale = (r: ApiSale): TradeItem => {
  const status = toStatus(r.status);
  return {
    id: String(r.id),
    title: r.title,
    thumbUrl: r.image,
    status,
    statusText: STATUS_LABEL[status],
    counterparty: r.meAsSeller,
    auctionStart: r.startAt,
    auctionEnd: r.endAt,
  };
};

/* =========================
 *     Example helpers
 * ========================= */

// 리스트 변환 유틸(안전)
export const mapPurchases = (
  rows: ApiPurchase[] | null | undefined
): TradeItem[] => (rows ?? []).map(fromPurchase);

export const mapSales = (rows: ApiSale[] | null | undefined): TradeItem[] =>
  (rows ?? []).map(fromSale);

// 필터 샘플
export const filterOngoing = (rows: TradeItem[]) => rows.filter(isOngoing);
export const filterEnded = (rows: TradeItem[]) => rows.filter(isEnded);
