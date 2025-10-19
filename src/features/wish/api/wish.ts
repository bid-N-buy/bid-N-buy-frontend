import api from "../../../shared/api/axiosInstance";
import type { WishToggleResponse } from "../types/wish";

export const toggleWish = async (
  auctionId: number
): Promise<WishToggleResponse> => {
  const { data } = await api.post<WishToggleResponse>(
    `/wishs/${auctionId}/like`
  );
  return data;
};

// GET /wishs 관련 여기 추가하세요
