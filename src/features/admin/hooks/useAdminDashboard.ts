import { useState, useEffect, useCallback } from "react";
import adminApi from "../api/adminAxiosInstance";
import type {
  ManageInquiryProps,
  AdminManageInquiry,
  AdminManageUser,
  ManageUserProps,
} from "../types/AdminType";
import {
  fetchAuctions,
  type FetchAuctionsParams,
} from "../../auction/api/auctions";
import type { AuctionItem, AuctionsRes } from "../../auction/types/auctions";
import { getError } from "../../../shared/utils/getError";

export type InquiryFilterParams = {
  title?: string;
  userEmail?: string;
  type?: "GENERAL" | "REPORT";
  status?: "WAITING" | "COMPLETE";
};

export const useInquiryList = (options?: { size?: number }) => {
  const [inquiryList, setInquiryList] = useState<AdminManageInquiry[]>([]);
  const [pages, setPages] = useState<ManageInquiryProps>();

  const getInquiryList = async (
    page: number,
    size?: number,
    filters?: InquiryFilterParams
  ) => {
    try {
      const sizeParam = size ?? options?.size;
      const params: Record<string, string | number> = { page };
      if (typeof sizeParam === "number") params.size = sizeParam;

      if (filters) {
        const { title, userEmail, type, status } = filters;
        if (title) params.title = title;
        if (userEmail) params.userEmail = userEmail;
        if (type) params.type = type;
        if (status) params.status = status;
      }

      const inquiries = (await adminApi.get(`/admin/inquiries`, { params }))
        .data;
      const pageInfo: ManageInquiryProps = inquiries;
      setInquiryList(inquiries.data);
      setPages(pageInfo);
    } catch (e) {
      console.error("문의/신고 현황 데이터 불러오기 실패:", e);
      setInquiryList([]);
    }
  };

  return { inquiryList, pages, getInquiryList };
};

export type UserFilterParams = {
  email?: string;
  activityStatus?: string;
};

export const useUserList = (options?: { size?: number }) => {
  const [userList, setUserList] = useState<AdminManageUser[]>([]);
  const [pages, setPages] = useState<ManageUserProps>();

  const getUserList = async (
    page: number,
    size?: number,
    filters?: UserFilterParams
  ): Promise<{ data: AdminManageUser[]; pages: ManageUserProps } | null> => {
    try {
      const sizeParam = size ?? options?.size;
      const params: Record<string, string | number> = { page };
      if (typeof sizeParam === "number") params.size = sizeParam;

      if (filters) {
        const { email } = filters; // activityStatus는 백에서 필터링 지원x 프론트에서 처리(AdminUserBoard에서)
        if (email) params.email = email;
      }

      if (import.meta.env.DEV) {
        console.log("[getUserList] 요청 파라미터:", params);
      }

      const users = (await adminApi.get(`/admin/users`, { params })).data;
      const pageInfo: ManageUserProps = users;
      setUserList(users.data);
      setPages(pageInfo);
      return { data: users.data, pages: pageInfo };
    } catch (e) {
      console.error("유저 데이터 불러오기 실패:", e);
      setUserList([]);
      return null;
    }
  };

  return { userList, pages, getUserList };
};

export type AdminAuctionProps = {
  params?: FetchAuctionsParams;
};

export const useAuctionList = ({ params }: AdminAuctionProps) => {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [pages, setPages] = useState<AuctionsRes>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuctionsList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // params 있으면 사용, 없으면 기본값 설정
      const query: FetchAuctionsParams = params
        ? {
            sortBy: "latest",
            includeEnded: true,
            ...params,
          }
        : {
            sortBy: "latest",
            includeEnded: true,
            page: 0,
            size: 20,
          };

      if (import.meta.env.DEV) {
        console.log("[getAuctionsList] 요청 파라미터:", query);
      }

      // fetchAuctions 재활용
      const data = await fetchAuctions(query);
      setAuctions(data.data);
      setPages(data);
    } catch (e) {
      console.error("데이터 불러오기 실패:", e);
      setError(getError(e, "알 수 없는 오류가 발생했습니다."));
      if (import.meta.env.DEV) {
        const error = e as {
          message?: string;
          response?: { data?: unknown; status?: number };
          config?: { url?: string; params?: unknown; headers?: unknown };
          request?: unknown;
        };
        console.error("[getAuctionsList] 에러 상세:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          config: error?.config,
          request: error?.request,
        });
        if (error?.config) {
          console.error("[getAuctionsList] 요청 URL:", error.config.url);
          console.error(
            "[getAuctionsList] 요청 파라미터:",
            error.config.params
          );
          console.error("[getAuctionsList] 요청 헤더:", error.config.headers);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    getAuctionsList();
  }, [getAuctionsList]);

  return { auctions, pages, loading, error, getAuctionsList };
};
