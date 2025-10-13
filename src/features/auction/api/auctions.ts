import api from "../../../shared/api/axiosInstance";
import type {
  CreateAuctionReq,
  CreateAuctionRes,
  AuctionDetail,
  PageResponse,
} from "../types/auctions";

// 경매 상품 등록
export const createAuction = async (payload: CreateAuctionReq) => {
  const { data } = await api.post<CreateAuctionRes>("/auctions", payload);
  return data;
};

// 경매 상세
export const getAuctionById = async (auctionId: number) => {
  const { data } = await api.get<PageResponse<AuctionDetail>>(
    `/auctions/${auctionId}`
  );

  // 백 응답이 PageResponse 형태로 오는 경우
  if (data && Array.isArray(data.data) && data.data.length > 0) {
    return data.data[0];
  }

  // 혹시 백이 단일 객체로 바꾸면 아래로 대응
  // if ((data as any).auctionId) {
  //   return data as AuctionDetail;
  // }

  throw new Error("경매 상세 데이터 형식이 올바르지 않습니다.");
};
