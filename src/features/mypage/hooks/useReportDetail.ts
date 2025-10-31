import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../auth/store/authStore";

const BASE = import.meta.env.VITE_BACKEND_ADDRESS ?? "http://localhost:8080";

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

export function useReportDetail(reportId?: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const headers = useMemo(
    () =>
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    [accessToken]
  );

  const [data, setData] = useState<ReportDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        const res = await axios.get<{ data: ReportDetailDTO }>(
          `${BASE}/reports/${reportId}`,
          { headers }
        );
        if (!alive) return;
        setData(res.data?.data ?? null);
      } catch (e: any) {
        if (!alive) return;
        setErrMsg(
          e?.response?.data?.message ||
            e?.message ||
            "신고 상세를 불러오지 못했습니다."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [reportId, headers]);

  return { data, loading, errMsg };
}
