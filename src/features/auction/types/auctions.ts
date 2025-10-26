export type ImageType = "MAIN" | "PRODUCT";

export interface AuctionImage {
  imageUrl: string;
  imageType: ImageType;
}

// 요청 dto
// 서버 업로드 방식 폼 타입 (images 제외)
export interface CreateAuctionForm {
  categoryId: number;
  title: string;
  description: string;
  startPrice: number;
  minBidPrice: number;
  startTime: string;
  endTime: string;
}

// 응답 dto
export interface CreateAuctionRes {
  auctionId: number;
  title: string;
  message: string;
}

// 상세
export interface AuctionDetail {
  images: AuctionImage[]; // [{ imageUrl, imageType }]
  auctionId: number;
  title: string;
  description: string;
  categoryId: number;
  categoryMain: string;
  categorySub: string;
  currentPrice: number;
  minBidPrice: number;
  bidCount: number;
  startTime: string; // "2025-10-15T13:50:00"
  createdAt: string; // "2025-10-15T13:49:42.106429" // 지금 사용x
  endTime: string;
  sellerId: number;
  sellerNickname: string;
  sellerProfileImageUrl: string | null;
  sellerTemperature: number;
  sellingStatus: string;
  wishCount: number;
  liked?: boolean; // 추가 예정이라 optional
}

// 페이지 래퍼(백 응답 예시 형태)
export interface PageResponse<T> {
  data: T[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

export interface AuctionItem {
  auctionId: number;
  title: string;
  currentPrice: number;
  createdAt: string;
  endTime: string;
  mainImageUrl: string | null;
  sellingStatus: "시작전" | "진행중" | "완료" | "종료";
  sellerId?: number;
  sellerNickname: string;
  wishCount: number;
  liked?: boolean; // 추가 예정이라 optional
}

export interface AuctionsRes {
  data: AuctionItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  first: boolean;
  last: boolean;
}

// 입찰
export interface BidItem {
  bidId: number;
  userId: number;
  auctionId: number;
  bidPrice: number;
  bidTime: string;
}

export interface ApiEnvelope<T> {
  error: string | null;
  message: string | null;
  item: T | null;
  data: unknown | null;
}

export type PostBidResponse = ApiEnvelope<BidItem>;
export interface BidRequest {
  bidPrice: number;
}
