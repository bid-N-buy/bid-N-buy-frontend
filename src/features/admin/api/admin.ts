import adminApi from "./adminAxiosInstance";

// 거래글 삭제
export const adminDeleteAuction = async (
  auctionId: number
): Promise<{ message?: string }> => {
  const res = await adminApi.delete(`/auctions/admin/${auctionId}`);
  return res.data;
};
