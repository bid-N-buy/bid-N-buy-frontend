import type { AuctionItem } from "../../auction/types/auctions";

export interface AdminProps {
  adminId: number;
  email: string;
  password: string;
  ipAddress: string;
  nickname: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  grantType: "Bearer";
  accessTokenExpiresIn: number;
}

export interface AdminAlarmPostProps {
  alarmType: string;
  content: string;
}

export interface AdminPagination<T> extends PageProps {
  // 모든 목록 데이터는 'data' 필드에 담겨 있습니다.
  data: T[];
}

export interface PageProps {
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  first: boolean; // 현재 페이지가 첫 페이지인지 여부
  last: boolean; // 현재 페이지가 마지막 페이지인지 여부
}

export interface AdminManageUser {
  userId: number;
  email: string;
  nickname: string;
  createdAt: string; // ISO 8601 형식 문자열
  penaltyPoints: number;
  activityStatus: string;
  suspendedUntil: string | null; // 정지 기간이 없을 수 있으므로 null 허용
  suspended: boolean;
}
export type ManageUserProps = AdminPagination<AdminManageUser>;

export interface AdminManageInquiry {
  inquiriesId: number;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  userId: number;
  userEmail: string;
  userNickname: string;
}

export type ManageInquiryProps = AdminPagination<AdminManageInquiry>;
