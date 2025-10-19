export interface WishToggleResponse {
  auctionId: number;
  wishCount: number;
  liked: boolean;
}

// 리스트/상세에서 초기값 바인딩 시 사용 (선택)
export interface WishState {
  wishCount: number;
  liked: boolean;
}

// GET /wishs 관련 여기 추가하세요
