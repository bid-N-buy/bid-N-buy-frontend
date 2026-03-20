import { API_BASE } from "../../../shared/api/axiosInstance";
import { useSupport } from "./useSupport";

type InquiryDetailDTO = {
  inquiriesId: number;
  title: string;
  content: string;
  status: string;
  type: string;
  createdAt: string;
  // 답변 필드(백엔드 명세에 맞게 필요 시 수정)
  requestTitle?: string | null;
  requestContent?: string | null;
};

export function useInquiryDetail(id?: string) {
  return useSupport<InquiryDetailDTO>(`${API_BASE}/inquiries`, id);
}
