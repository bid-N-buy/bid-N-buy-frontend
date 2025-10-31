import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../auth/store/authStore";

const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

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

export function useInquiryDetail(inquiryId?: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const headers = useMemo(
    () =>
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    [accessToken]
  );

  const [data, setData] = useState<InquiryDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!inquiryId) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        const res = await axios.get<{ data: InquiryDetailDTO }>(
          `${BASE}/inquiries/${inquiryId}`,
          { headers }
        );
        if (!alive) return;
        setData(res.data?.data ?? null);
      } catch (e: any) {
        if (!alive) return;
        setErrMsg(
          e?.response?.data?.message ||
            e?.message ||
            "문의 상세를 불러오지 못했습니다."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [inquiryId, headers]);

  return { data, loading, errMsg };
}
