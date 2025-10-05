// 백 응답 스키마
export interface AuctionResponse {
  auctionId: number;
  title: string;
  currentPrice: number;
  endTime: string;
  mainImageUrl: string | null;
  sellingStatus: string;
  categoryName: string;
}

// ProductCard Props
export interface ProductCardProps {
  // 필수 필드
  auctionId: number;
  title: string;
  currentPrice: number;
  mainImageUrl: string | null;
  sellingStatus: string;

  // 선택 필드.... 여기 다시 체크
  nickname?: string;
  liked?: boolean;
  likeCount?: number;
  chatCount?: number;

  onCardClick?: (auctionId: number) => void;
  onLikeToggle?: (auctionId: number, liked: boolean) => void;
}
