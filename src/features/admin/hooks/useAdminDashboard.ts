import { useState, useEffect } from "react";
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
        const { email, activityStatus } = filters;
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

  const getAuctionsList = async () => {
    try {
      setLoading(true);
      setError(null);
      const query: FetchAuctionsParams = {
        sortBy: "latest",
        includeEnded: true,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        ...(params ?? {}),
      };
      const data: AuctionsRes = await fetchAuctions(query);
      const list =
        (data as any).data ??
        (data as any).items ??
        (data as any).content ??
        [];
      setAuctions(list);
      setPages(data);
    } catch (e) {
      console.error("데이터 불러오기 실패:", e);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAuctionsList();
  }, [params]);

  return { auctions, pages, getAuctionsList };
};
