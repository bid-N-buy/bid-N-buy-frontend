import api from "../../../shared/api/axiosInstance";
import type {
  CreateAuctionForm,
  CreateAuctionRes,
  AuctionDetail,
  PageResponse,
} from "../types/auctions";
import axios from "axios";

// 경매 상품 등록 (서버 업로드 + 한번에 multipart/form-data)
export const createAuction = async (form: CreateAuctionForm, files: File[]) => {
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
  files.forEach((f) => fd.append("images", f));

  const { data } = await api.post<CreateAuctionRes>("/auctions", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return data;
};

// 경매 상세
export const getAuctionById = async (
  auctionId: number
): Promise<AuctionDetail> => {
  try {
    const { data } = await api.get<AuctionDetail | { data: AuctionDetail }>(
      `/auctions/${auctionId}`
    );

    // { data: {...} } 형태도 허용
    const detail: AuctionDetail = (data as any)?.data?.auctionId
      ? (data as any).data
      : (data as any);

    // 필수 필드 최소 검증
    if (!detail || typeof detail !== "object" || !detail.auctionId) {
      throw new Error("INVALID_RESPONSE_SHAPE");
    }

    // images 없거나 배열 아닌 경우 예방적으로 보정
    if (!Array.isArray(detail.images)) {
      (detail as any).images = [];
    }

    return detail;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const serverMsg = (err.response?.data as any)?.message;

      if (status === 401) throw new Error("401 인증이 필요합니다.");
      if (status === 403) throw new Error("403 접근 권한이 없습니다.");
      if (status === 404) throw new Error("404 존재하지 않는 경매입니다.");
      throw new Error(`${status ?? ""} ${serverMsg ?? err.message}`.trim());
    }
    throw err;
  }
};
