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

export const useInquiryList = (options?: { size?: number }) => {
  const [inquiryList, setInquiryList] = useState<AdminManageInquiry[]>([]);
  const [pages, setPages] = useState<ManageInquiryProps>();

  const getInquiryList = async (page: number, size?: number) => {
    try {
      const sizeParam = size ?? options?.size;
      const url = sizeParam
        ? `/admin/inquiries?page=${page}&size=${sizeParam}`
        : `/admin/inquiries?page=${page}`;
      const inquiries = (await adminApi.get(url)).data;
      const pageInfo: ManageInquiryProps = inquiries;
      setInquiryList(inquiries.data);
      setPages(pageInfo);
    } catch (e) {
      console.error("문의/신고 현황 데이터 불러오기 실패:", e);
      setInquiryList([]);
    }
  };

  useEffect(() => {
    getInquiryList(0, options?.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { inquiryList, pages, getInquiryList };
};

export const useUserList = (options?: { size?: number }) => {
  const [userList, setUserList] = useState<AdminManageUser[]>([]);
  const [pages, setPages] = useState<ManageUserProps>();

  const getUserList = async (page: number, size?: number) => {
    try {
      const sizeParam = size ?? options?.size;
      const url = sizeParam
        ? `/admin/users?page=${page}&size=${sizeParam}`
        : `/admin/users?page=${page}`;
      const users = (await adminApi.get(url)).data;
      const pageInfo: ManageUserProps = users;
      setUserList(users.data);
      setPages(pageInfo);
    } catch (e) {
      console.error("유저 데이터 불러오기 실패:", e);
      setUserList([]);
    }
  };

  useEffect(() => {
    getUserList(0, options?.size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { userList, pages, getUserList };
};

export type AdminAuctionProps = {
  params?: Omit<FetchAuctionsParams, "page">;
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
