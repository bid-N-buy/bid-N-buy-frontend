import api from "../../../shared/api/axiosInstance";
import type {
  CreateAuctionForm,
  CreateAuctionRes,
  AuctionDetail,
  PageResponse,
} from "../types/auctions";
import axios from "axios";

// 경매 상품 등록 (서버 업로드 + 한번에 multipart/form-data)
export async function createAuction(form: CreateAuctionForm, files: File[]) {
  const fd = new FormData();

  // @ModelAttribute 로 매핑될 필드들
  fd.append("categoryId", String(form.categoryId));
  fd.append("title", form.title);
  fd.append("description", form.description);
  fd.append("startPrice", String(form.startPrice));
  fd.append("minBidPrice", String(form.minBidPrice));
  fd.append("startTime", form.startTime);
  fd.append("endTime", form.endTime);

  // @RequestPart("images") List<MultipartFile>
  files.forEach((f) => fd.append("images", f)); // 키 이름 "images" 유지!

  const { data } = await api.post<CreateAuctionRes>("/auctions", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return data;
}

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

    // 배열만 오는 경우(방어)
    if (Array.isArray(body) && body.length > 0 && body[0]?.auctionId) {
      return body[0] as AuctionDetail;
    }

    throw new Error("NOT_FOUND_OR_INVALID_SHAPE");
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const msg =
        (err.response?.data as any)?.message ?? err.message ?? "요청 실패";
      throw new Error(`${status ?? ""} ${msg}`.trim());
    }
    throw err;
  }
};
