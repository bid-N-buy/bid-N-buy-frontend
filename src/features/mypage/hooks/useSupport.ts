import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../auth/store/authStore";

export function useSupport<T>(url?: string, id?: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const headers = useMemo(
    () =>
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    [accessToken]
  );

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        const res = await axios.get<{ data: T }>(`${url}/${id}`, { headers });
        if (!alive) return;
        setData(res.data?.data ?? null);
      } catch (e: any) {
        if (!alive) return;
        setErrMsg(
          e?.response?.data?.message ||
            e?.message ||
            "상세 내용을 불러오지 못했습니다."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [url, id, headers]);

  return { data, loading, errMsg };
}
