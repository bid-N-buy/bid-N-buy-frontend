import { API_BASE } from "../../../shared/api/axiosInstance";
import { useSupport } from "./useSupport";

type ReportDetailDTO = {
  reportId: number;
  title: string;
  content: string;
  status: string;
  type: string;
  createdAt: string;
  requestTitle?: string | null;
  requestContent?: string | null;
};

export function useReportDetail(id?: string) {
  return useSupport<ReportDetailDTO>(`${API_BASE}/reports`, id);
}
