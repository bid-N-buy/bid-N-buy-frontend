import api from "../../../shared/api/axiosInstance";
import type {
  CreateAuctionReq,
  CreateAuctionRes,
  AuctionDetail,
  PageResponse,
} from "../types/auctions";
import axios from "axios";

// 경매 상품 등록
export const createAuction = async (payload: CreateAuctionReq) => {
  const { data } = await api.post<CreateAuctionRes>("/auctions", payload);
  return data;
};

// 경매 상세
export const getAuctionById = async (
  auctionId: number
): Promise<AuctionDetail> => {
  try {
    const res = await api.get(`/auctions/${auctionId}`);
    const body = res.data;

    // 현재 스키마
    if (body && Array.isArray(body.data) && body.data.length > 0) {
      return body.data[0] as AuctionDetail;
    }

    // { data: { ... } } 로 오는 경우
    if (
      body &&
      body.data &&
      typeof body.data === "object" &&
      body.data.auctionId
    ) {
      return body.data as AuctionDetail;
    }

    // 단일 객체로 오는 경우
    if (body && typeof body === "object" && body.auctionId) {
      return body as AuctionDetail;
    }

    // 배열만 오는 경우(비정상이나 방어)
    if (Array.isArray(body) && body.length > 0 && body[0]?.auctionId) {
      return body[0] as AuctionDetail;
    }

    throw new Error("NOT_FOUND_OR_INVALID_SHAPE");
  } catch (err) {
    // 서버 메시지
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const msg =
        (err.response?.data as any)?.message ?? err.message ?? "요청 실패";
      throw new Error(`${status ?? ""} ${msg}`.trim());
    }
    throw err;
  }
};
