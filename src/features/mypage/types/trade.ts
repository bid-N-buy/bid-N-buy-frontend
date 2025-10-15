export type TradeKind = "purchase" | "sale";

export interface TradeItem {
  id: string;
  title: string;
  sellerName: string;
  thumbUrl: string;
  status: "입찰 중" | "낙찰" | "마감" | "대기";
  auctionStart?: string; // ISO
  auctionEnd?: string; // ISO
}

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
  itemImageUrl: string;     // 썸네일
  startTime: string;        // ISO
  endTime: string;          // ISO
  finalPrice: number;       // 최종가(낙찰가)
  winnerNickname: string;   // 낙찰자
  statusText: string;       // "결제 대기 중 (진행 중)" 등 서버 가공 텍스트
};

export type TradeRole = "buyer" | "seller";