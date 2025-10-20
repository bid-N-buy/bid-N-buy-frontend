import { useEffect, useState } from "react";
import api from "../../../shared/api/axiosInstance";

export type PreviewItem = {
  id: string | number;
  title: string;
  thumbnail?: string;
};

type ListRes = {
  items: Array<{ id: number; title: string; itemImageUrl?: string }>;
  total?: number;
};

function mapPreview(items: ListRes["items"]): PreviewItem[] {
  return (items ?? []).map((it) => ({
    id: it.id,
    title: it.title,
    thumbnail: it.itemImageUrl ?? "",
  }));
}

export function useSalePreview(status: "DONE" | "BIDDING") {
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ListRes>("/mypage/sales", {
          params: { status, page: 0, size: 3, sort: "end" },
        });
        if (!alive) return;
        setItems(mapPreview(data.items ?? data ?? []));
        setCount(data.total ?? data.items?.length ?? 0);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [status]);

  return { items, count, loading, error };
}
