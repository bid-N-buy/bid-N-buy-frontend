export type ImageType = "PRODUCT";

export interface AuctionImage {
  imageUrl: string; // "https://fake-s3-bucket.com/images/vintage_lego_main.jpg"
  imageType: ImageType;
}

// 요청 dto
export interface CreateAuctionReq {
  categoryId: number;
  title: string;
  description: string;
  startPrice: number;
  minBidPrice: number;
  startTime: string; // "2025-10-12T03:20:00"
  endTime: string;
  images: AuctionImage[];
}

// 응답 dto
export interface CreateAuctionRes {
  auctionId: number;
  title: string;
  message: string;
}

// 상세
export interface AuctionDetail {
  auctionId: number;
  title: string;
  description: string;
  currentPrice: number;
  endTime: string;
  mainImageUrl: string;
  sellingStatus: string; // 예) "진행 중"
  categoryName: string;
  sellerNickname: string;
  wishCount: number;
  // 이미지 여러 장일 수 있으니 선택 필드로
  imageUrls?: string[];
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
