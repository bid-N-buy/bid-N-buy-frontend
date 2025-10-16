export type TradeKind = "purchase" | "sale";

export type TradeItem = {
  auctionId: number;
  title: string;
  thumbnailUrl?: string | null;
  price: number;
  status: "WAIT_PAY" | "PAID" | "SHIPPING" | "DONE" | "CANCELED";
  statusText: string; // 화면표시용
  counterparty?: string; // 판매자/구매자 닉네임
  endedAt?: string; // 거래 시각
};

// 서버 응답이 구매/판매가 다르다면 여기서 공통 형태로 변환
export type PurchaseResponseItem = {
  id: number;
  itemName: string;
  seller: string;
  thumbnail: string;
  status: string;
  startAt?: string;
  endAt?: string;
};

export type SaleResponseItem = {
  id: number;
  title: string;
  meAsSeller: string;
  image: string;
  status: string;
  startAt?: string;
  endAt?: string;
};

export type AuctionHistoryItem = {
  auctionId: number;
  title: string;
  itemImageUrl: string; // 썸네일
  startTime: string; // ISO
  endTime: string; // ISO
  finalPrice: number; // 최종가(낙찰가)
  winnerNickname: string; // 낙찰자
  statusText: string; // "결제 대기 중 (진행 중)" 등 서버 가공 텍스트
};

export type TradeRole = "buyer" | "seller";

export type TradeStatus =
  | "WAIT_PAY"
  | "PAID"
  | "SHIPPED"
  | "CLOSED"
  | "CANCELED"
  | "BIDDING";
