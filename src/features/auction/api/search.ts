import api from "../../../shared/api/axiosInstance";
import type { AuctionSearchApiRes } from "../types/search";

export const fetchAuctionsByKeyword = async (params: {
  searchKeyword: string;
  page?: number;
  size?: number;
}): Promise<AuctionSearchApiRes> => {
  const res = await api.get<AuctionSearchApiRes>("/auctions/search", {
    params,
  });
  return res.data;
};

export const fetchAuctionsByMain = async (params: {
  mainCategoryId: number;
  page?: number;
  size?: number;
}): Promise<AuctionSearchApiRes> => {
  const res = await api.get<AuctionSearchApiRes>("/auctions/filter/main", {
    params,
  });
  return res.data;
};

export const fetchAuctionsBySub = async (params: {
  subCategoryId: number;
  page?: number;
  size?: number;
}): Promise<AuctionSearchApiRes> => {
  const res = await api.get<AuctionSearchApiRes>("/auctions/filter/sub", {
    params,
  });
  return res.data;
};
