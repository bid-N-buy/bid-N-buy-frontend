import api from "../../../shared/api/axiosInstance";
import type { CreateAuctionReq, CreateAuctionRes } from "../types/auctions";

export const createAuction = async (payload: CreateAuctionReq) => {
  const { data } = await api.post<CreateAuctionRes>("/auctions", payload);
  return data;
};
