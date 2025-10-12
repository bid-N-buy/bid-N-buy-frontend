export type ImageType = "MAIN" | "DETAIL"; // 일단 있으니까..

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

export interface AuctionImage {
  imageUrl: string; // "https://fake-s3-bucket.com/images/vintage_lego_main.jpg"
  imageType: ImageType; // "MAIN" | "DETAIL"
}

// 응답 dto
export interface CreateAuctionRes {
  auctionId: number;
  title: string;
  message: string;
}
