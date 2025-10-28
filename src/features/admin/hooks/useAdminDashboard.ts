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

export const useInquiryList = () => {
  const [inquiryList, setInquiryList] = useState<AdminManageInquiry[]>([]);
  const [pages, setPages] = useState<ManageInquiryProps>();

  const getInquiryList = async (page: number) => {
    try {
      const inquiries = (await adminApi.get(`/admin/inquiries?page=${page}`))
        .data;
      const pageInfo: ManageInquiryProps = inquiries;
      setInquiryList(inquiries.data);
      setPages(pageInfo);
    } catch (error) {
      setInquiryList([]);
      console.error("데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    getInquiryList(0);
  }, []);

  return { inquiryList, pages, getInquiryList };
};

export const useUserList = () => {
  const [userList, setUserList] = useState<AdminManageUser[]>([]);
  const [pages, setPages] = useState<ManageUserProps>();

  const getUserList = async (page: number) => {
    try {
      const users = (await adminApi.get(`/admin/users?page=${page}`)).data;
      const pageInfo: ManageUserProps = users;
      setUserList(users.data);
      setPages(pageInfo);
    } catch (error) {
      setUserList([]);
      console.error("데이터 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    getUserList(0);
  }, []);

  return { userList, pages, getUserList };
};

export type AdminAuctionProps = {
  params?: Omit<FetchAuctionsParams, "size" | "page">;
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
        page: 0,
        size: 20,
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
    } catch (error) {
      console.error("데이터 불러오기 실패:", error);
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
