export interface AuctionSearchItem {
  auctionId: number;
  title: string;
  currentPrice: number;
  endTime: string;
  mainImageUrl: string | null;
  sellingStatus: "시작전" | "진행중" | "완료" | "종료";
  sellerNickname: string;
  wishCount: number;
}

export interface AuctionSearchApiRes {
  data: AuctionSearchItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}
