/* =========================
 *        Types
 * ========================= */

export type TradeKind = "purchase" | "sale";

export type TradeStatus =
  | "BEFORE" // 등록 전/비공개(판매탭에선 진행으로 취급)
  | "SALE" // 판매 중(입찰 가능)
  | "COMPLETED" // 거래 완료
  | "PROGRESS" // 결제/배송/정산 등 진행 중
  | "FINISH"; // 경매/판매 종료(더 이상 입찰 X)

// 구매/판매 내역 탭 필터(백엔드 enum 대응)
export type TradeFilterStatus = "ALL" | "ONGOING" | "COMPLETED" | "CANCELLED";

// 화면 공통 표준 모델 (단일 소스)
export type TradeItem = {
  id: string; // 공통 id (문자열 권장)
  title: string;
  thumbUrl?: string | null;
  price?: number;
  status: TradeStatus;
  statusText?: string;
  counterparty?: string; // 구매면 판매자, 판매면 구매자(혹은 meAsSeller / winnerNickname)
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
  seller?: string;
  thumbnail?: string | null;
  status?: string; // BEFORE/SALE/COMPLETED/PROGRESS/FINISH ... 혹은 한글/영어표시
  startAt?: string; // ISO
  endAt?: string; // ISO
  // 호환을 위해 들어올 수 있는 추가 키들(무시/백업용)
  title?: string;
  image?: string | null;
  itemImageUrl?: string | null;
  startTime?: string;
  endTime?: string;
  finalPrice?: number;
  winnerNickname?: string;
  statusText?: string;
};

// 판매 탭 API 예시 (/mypage/sales 샘플 포함)
export type ApiSale = {
  id?: number; // 일부 API는 id
  auctionId?: number; // /mypage/sales 는 auctionId
  title: string;
  meAsSeller?: string; // 나(판매자)
  image?: string | null;
  itemImageUrl?: string | null; // /mypage/sales
  status?: string; // BEFORE/SALE/... 또는 한글/영문키
  startAt?: string;
  endAt?: string;
  startTime?: string; // /mypage/sales
  endTime?: string; // /mypage/sales
  finalPrice?: number; // /mypage/sales
  winnerNickname?: string; // /mypage/sales
  buyerNickname?: string;
  statusText?: string; // /mypage/sales (예: "결제 대기 중 (진행 중)")
};

// ✅ 기존 코드 호환 alias
export type PurchaseResponseItem = ApiPurchase;
export type SaleResponseItem = ApiSale;

/* =========================
 *     Status Utilities
 * ========================= */

// 화면 표기 라벨(기본)
export const STATUS_LABEL: Record<TradeStatus, string> = {
  BEFORE: "등록 전",
  SALE: "판매 중",
  PROGRESS: "진행 중",
  COMPLETED: "거래 완료",
  FINISH: "종료됨",
};

// 영어/기타 문자열을 한글로 보정하는 매퍼 (statusText가 없을 때 보조)
const STATUS_TEXT_MAP: Record<string, string> = {
  WAIT_PAY: "결제 대기 중",
  WAITING_PAYMENT: "결제 대기 중",
  PAID: "결제 완료",
  CLOSED: "종료됨",
  CLOSE: "종료됨",
  WIN: "낙찰",
  CANCELED: "취소됨",
  CANCELLED: "취소됨",
  IN_PROGRESS: "진행 중",
  RUNNING: "진행 중",
  DONE: "거래 완료",
};

// 한/영/혼합 표기 정규화 → TradeStatus
export const toStatus = (raw?: string, statusText?: string): TradeStatus => {
  if (!raw && !statusText) return "FINISH";
  const u = String(raw ?? statusText ?? "")
    .trim()
    .toUpperCase();

  // 직접 매핑(한글/영문)
  if (["BEFORE", "경매전", "경매 전", "READY", "NOT_STARTED"].includes(u))
    return "BEFORE";
  if (
    [
      "SALE",
      "진행 중",
      "IN_PROGRESS",
      "RUNNING",
      "ON_SALE",
      "BIDDING",
    ].includes(u)
  )
    return "SALE";
  if (
    [
      "PROGRESS",
      "결제 중",
      "결재 중",
      "PAYMENT",
      "PAYMENT_PENDING",
      "WAIT_PAY",
      "WAITING_PAYMENT",
      "PAID",
    ].includes(u)
  )
    return "PROGRESS";
  if (["COMPLETED", "경매 완료", "DONE", "FINISH"].includes(u))
    return "COMPLETED";
  if (["CLOSED", "CLOSE", "CANCELLED", "CANCELED", "종료", "만료"].includes(u))
    return "FINISH";

  // 괄호형 텍스트(예: "결제 대기 중 (진행 중)")에서 내부 상태 힌트 추출
  if (/\(.*진행\s*중.*\)/.test(u) || /\(.*IN_PROGRESS.*\)/.test(u))
    return "PROGRESS";
  if (/결제\s*대기/.test(u)) return "PROGRESS";
  if (/완료/.test(u)) return "COMPLETED";

  return "FINISH";
};

// 종료시간 기반 보조 판정 (end가 과거면 종료 취급)
export const isEndedByTime = (endAt?: string): boolean => {
  if (!endAt) return false;
  const end = new Date(endAt).getTime();
  return Number.isFinite(end) ? end <= Date.now() : false;
};

/** 시간까지 고려한 "실효 상태" 도출
 * - COMPLETED 는 무조건 완료 우선
 * - 종료시간이 지났으면 FINISH 로 강제
 * - 그 외에는 본래 status 유지
 */
export const deriveEffectiveStatus = (
  item: Pick<TradeItem, "status" | "auctionEnd">
): TradeStatus => {
  if (item.status === "COMPLETED") return "COMPLETED";
  if (isEndedByTime(item.auctionEnd)) return "FINISH";
  return item.status;
};

// 진행/종료 여부 (실효 상태 + 시간 고려)
export const isOngoing = (
  item: Pick<TradeItem, "status" | "auctionEnd">
): boolean => {
  const eff = deriveEffectiveStatus(item);
  return eff === "SALE" || eff === "PROGRESS" || eff === "BEFORE";
};

export const isEnded = (
  item: Pick<TradeItem, "status" | "auctionEnd">
): boolean => {
  const eff = deriveEffectiveStatus(item);
  return eff === "FINISH" || eff === "COMPLETED";
};

// 정렬: 진행 우선 → 종료 뒤로, 종료 내에서는 종료시각 최근순
export const compareTradeItems = (a: TradeItem, b: TradeItem): number => {
  const ea = deriveEffectiveStatus(a);
  const eb = deriveEffectiveStatus(b);

  // 진행건을 상단에: SALE(0) → PROGRESS(1) → BEFORE(2) → FINISH(3) → COMPLETED(4)
  const ORDER: Record<TradeStatus, number> = {
    SALE: 0,
    PROGRESS: 1,
    BEFORE: 2,
    FINISH: 3,
    COMPLETED: 4,
  };

  const so = ORDER[ea] - ORDER[eb];
  if (so !== 0) return so;

  // 동일 그룹이면 종료시각 내림차순(최근 종료가 위)
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

const pickThumb = (r: any): string | null =>
  r?.thumbnail ?? r?.image ?? r?.itemImageUrl ?? r?.mainImageUrl ?? null;

const pickStart = (r: any): string | undefined =>
  r?.startAt ?? r?.startTime ?? undefined;

const pickEnd = (r: any): string | undefined =>
  r?.endAt ?? r?.endTime ?? undefined;

const pickCounterpartyPurchase = (r: any): string | undefined =>
  r?.seller ?? r?.sellerNickname ?? r?.winnerNickname ?? undefined;

// ⚠️ 판매에서는 상대방(구매자/낙찰자)을 우선적으로 표시
const pickCounterpartySale = (r: any): string | undefined =>
  r?.winnerNickname ?? r?.buyerNickname ?? r?.meAsSeller ?? undefined;

const pickPrice = (r: any): number | undefined =>
  typeof r?.finalPrice === "number"
    ? r.finalPrice
    : typeof r?.currentPrice === "number"
      ? r.currentPrice
      : typeof r?.price === "number"
        ? r.price
        : undefined;

const pickStatusTextKR = (
  status?: string,
  statusText?: string
): string | undefined => {
  if (statusText && String(statusText).trim()) return statusText;
  if (!status) return undefined;
  const key = String(status).trim().toUpperCase();
  if (STATUS_TEXT_MAP[key]) return STATUS_TEXT_MAP[key];
  // ENUM 라벨로 대체
  const s = toStatus(key);
  return STATUS_LABEL[s];
};

export const fromPurchase = (r: ApiPurchase): TradeItem => {
  const status = toStatus(r.status, r.statusText);
  return {
    id: String(r.id),
    title: r.itemName ?? r.title ?? "",
    thumbUrl: pickThumb(r),
    status,
    statusText: pickStatusTextKR(r.status, (r as any).statusText),
    counterparty: pickCounterpartyPurchase(r),
    auctionStart: pickStart(r),
    auctionEnd: pickEnd(r),
    price: pickPrice(r),
  };
};

export const fromSale = (r: ApiSale): TradeItem => {
  const id = typeof r.id === "number" ? r.id : (r.auctionId as number);
  const status = toStatus(r.status, r.statusText);
  return {
    id: String(id),
    title: r.title ?? "",
    thumbUrl: pickThumb(r),
    status,
    statusText: pickStatusTextKR(r.status, r.statusText),
    counterparty: pickCounterpartySale(r),
    auctionStart: pickStart(r),
    auctionEnd: pickEnd(r),
    price: pickPrice(r),
  };
};

/* =========================
 *  Lists & Filter Helpers
 * ========================= */

// 리스트 변환 유틸(안전)
export const mapPurchases = (
  rows: ApiPurchase[] | null | undefined
): TradeItem[] => (rows ?? []).map(fromPurchase);

export const mapSales = (rows: ApiSale[] | null | undefined): TradeItem[] =>
  (rows ?? []).map(fromSale);

// 필터 라벨(탭 표기)
export const FILTER_LABEL: Record<TradeFilterStatus, string> = {
  ALL: "전체",
  ONGOING: "진행 중",
  COMPLETED: "완료",
  CANCELLED: "취소/실패",
};

/** 필터 판정기
 * - 요구사항: 판매 탭에서는 BEFORE 노출(ONGOING으로 취급)
 * - 구매 탭에서는 BEFORE 미노출(초안은 구매자 관점에서 볼 일 없음)
 */
export const matchFilter = (
  kind: TradeKind,
  filter: TradeFilterStatus,
  item: TradeItem
): boolean => {
  const eff = deriveEffectiveStatus(item);

  // 정책: 구매 탭에서는 BEFORE 숨김
  if (kind === "purchase" && eff === "BEFORE") {
    return false;
  }

  // 판매 탭에서 BEFORE 노출(= 진행 중으로 취급)
  const treatBeforeAsOngoing = kind === "sale";

  switch (filter) {
    case "ALL":
      return kind === "purchase" ? eff !== "BEFORE" : true;

    case "ONGOING":
      if (isEndedByTime(item.auctionEnd)) return false; // 시간상 종료는 제외
      if (eff === "SALE" || eff === "PROGRESS") return true;
      if (eff === "BEFORE" && treatBeforeAsOngoing) return true;
      return false;

    case "COMPLETED":
      return eff === "COMPLETED";

    case "CANCELLED":
      // 완료가 아닌 종료(유찰/만료/취소 등) = FINISH
      return eff === "FINISH";

    default:
      return true;
  }
};

// 필터 적용 + 정렬까지 일괄
export const applyTradeFilter = (
  kind: TradeKind,
  filter: TradeFilterStatus,
  rows: TradeItem[]
): TradeItem[] =>
  rows.filter((r) => matchFilter(kind, filter, r)).sort(compareTradeItems);

/* =========================
 *   Legacy-style helpers
 * ========================= */

export const filterOngoing = (rows: TradeItem[]) => rows.filter(isOngoing);
export const filterEnded = (rows: TradeItem[]) => rows.filter(isEnded);
