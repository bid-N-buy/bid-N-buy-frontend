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
