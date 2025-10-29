// src/features/mypage/types/trade.ts

/* =========================
 * 기본 도메인 타입
 * ========================= */

// 구매/판매 구분 (필터 등에서 사용)
export type TradeKind = "purchase" | "sale";

// 내부 표준화된 상태
export type TradeStatus =
  | "BEFORE" // 경매 시작 전 (프리뷰 단계)
  | "SALE" // 경매/판매 중 (입찰 가능 / 노출 중)
  | "PROGRESS" // 낙찰 이후 결제/배송/정산 중
  | "COMPLETED" // 거래 완료
  | "FINISH" // 종료(입찰 불가/유찰/만료)
  | "UNKNOWN"; // 혹시 못 매핑된 경우 대비

// 마이페이지 상단 탭 필터에서 쓰는 상태
export type TradeFilterStatus = "ALL" | "ONGOING" | "COMPLETED" | "CANCELLED";

// 화면에서 공통으로 쓰는 표준 모델
export type TradeItem = {
  /** 상세/딜 라우팅에 쓰는 기본 ID. 응답의 auctionId나 id 등을 문자열로 normalize */
  id: string;

  /**
   * 구매 확정(정산) API에 넘길 식별자.
   * 서버에서 아직 정확히 뭐라고 줄지(orderId / settlementId / purchaseId 등) 안정화 안 된 상태라
   * 지금은 auctionId 등으로 fallback 하고 있음.
   * 없을 수도 있으므로 optional.
   */
  orderId?: string | number | null;

  /** 타이틀(상품명/경매명) */
  title: string;

  /** 썸네일 이미지 URL */
  thumbUrl?: string | null;

  /** 최종 금액 / 낙찰가 / 결제금액 등. 서버에서 아직 안내려줄 수도 있음 */
  price?: number;

  /** 정규화된 상태 enum (BEFORE / SALE / PROGRESS / COMPLETED / FINISH / UNKNOWN) */
  status: TradeStatus;

  /**
   * 사용자에게 그대로 보여줄 라벨.
   * 예: "시작 전 · 20시간 22분 남음"
   *     "진행 중 · 9시간 25분 남음"
   *     "거래 완료"
   *     "종료"
   */
  statusText?: string;

  /** 상대방 정보 (구매 목록이면 판매자 닉, 판매 목록이면 구매자/낙찰자 닉) */
  counterparty?: string;

  /** 경매/거래 시작 시각 (ISO) */
  auctionStart?: string;

  /** 경매/거래 마감 시각 (ISO) */
  auctionEnd?: string;

  /**
   * 이미 구매 확정/정산 완료된 건지 여부.
   * 프론트에서 "구매 확정" 버튼 노출 여부 판단용.
   * 서버에서 안 오면 기본 false.
   */
  settled?: boolean;
};

/* =========================
 * API 응답 타입 (서버 원본 형식)
 * ========================= */

// 구매 탭 등의 응답 원본
export type ApiPurchase = {
  auctionId?: number;
  id?: number;

  title?: string;
  itemName?: string;

  seller?: string;
  sellerNickname?: string;

  thumbnail?: string | null;
  image?: string | null;
  itemImageUrl?: string | null;

  status?: string; // 예: "결제 대기 중 (진행 중)"
  statusText?: string; // 서버 라벨 (있으면)

  startAt?: string;
  startTime?: string;

  endAt?: string;
  endTime?: string;

  finalPrice?: number;
  winnerNickname?: string;
  currentPrice?: number;
  price?: number;
};

// 판매 탭 등의 응답 원본
export type ApiSale = {
  id?: number;
  auctionId?: number;

  title?: string;
  meAsSeller?: string;

  image?: string | null;
  itemImageUrl?: string | null;

  status?: string; // ex. "BEFORE"/"SALE" 또는 한글 상태
  statusText?: string; // ex. "결제 대기 중 (진행 중)"

  startAt?: string;
  endAt?: string;
  startTime?: string;
  endTime?: string;

  finalPrice?: number;
  winnerNickname?: string;
  buyerNickname?: string;
};

// alias (기존 코드 호환용)
export type PurchaseResponseItem = ApiPurchase;
export type SaleResponseItem = ApiSale;
