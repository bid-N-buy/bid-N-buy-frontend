import api from "../../../shared/api/axiosInstance";

// 거래글 삭제
export const deleteAuction = async (
  auctionId: number
): Promise<{ message?: string }> => {
  const res = await api.delete(`/auctions/admin/${auctionId}`);
  return res.data;
};
