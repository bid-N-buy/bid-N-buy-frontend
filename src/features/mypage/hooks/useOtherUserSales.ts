// src/hooks/useOtherUserSales.ts
import { useEffect, useState, useCallback } from "react";
import api from "../../../shared/api/axiosInstance";
import { AxiosError } from "axios";

export type OtherSalesItem = {
  auctionId: number;
  title: string;
  itemImageUrl: string;
};

export type OtherSalesResponse = {
  completedSalesCount: number;
  completedSales: OtherSalesItem[];
  onSaleCount: number;
  onSale: OtherSalesItem[];
};

type Options = {
  targetUserId?: string;
  enabled?: boolean;
};

export const useOtherUserSales = ({
  targetUserId,
  enabled = true,
}: Options = {}) => {
  const [data, setData] = useState<OtherSalesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AxiosError | null>(null);

  const fetchData = useCallback(async () => {
    if (!targetUserId || !enabled) {
      setData(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let alive = true;

    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get<OtherSalesResponse>(
        `/auth/other/${targetUserId}/sales`,
        {
          withCredentials: true,
          signal: controller.signal,
        }
      );

      if (alive) setData(data);
    } catch (err) {
      if (alive && !controller.signal.aborted) {
        setError(err as AxiosError);
      }
    } finally {
      if (alive) setLoading(false);
    }

    return () => {
      alive = false;
      controller.abort();
    };
  }, [targetUserId, enabled]);

  useEffect(() => {
    const cleanup = fetchData();
    return () => void cleanup;
  }, [fetchData]);

  const refetch = useCallback(() => void fetchData(), [fetchData]);

  return { data, loading, error, refetch };
};
