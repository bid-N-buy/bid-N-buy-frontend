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

/* 리스트용 */
export type AdminUserListProps = {
  userList: AdminManageUser[];
};
export type AdminInquiryListProps = {
  inquiryList: AdminManageInquiry[];
};
export type AdminAuctionListProps = {
  auctions: AuctionItem[];
};

export interface AdminPenaltyPostProps {
  userId: number;
  onClose: () => void;
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
  createdAt: string;
  penaltyPoints: number;
  activityStatus: string;
  suspendedUntil: string | null;
  suspended: boolean;
}

export interface PenaltyHistoryItem {
  penaltyId: number;
  type: string;
  points: number;
  createdAt: string;
  active: boolean;
}

export interface UserDetailProps extends AdminManageUser {
  profileImageUrl: string | null;
  updatedAt: string;
  activityStatus: string;
  suspensionCount: number;
  banCount: number;
  penaltyHistory: PenaltyHistoryItem[];
  auctionCount: number;
  userType: string | null;
  userTemperature: number | null;
  deletedAt: string | null;
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

export interface AdminInquiryPostProps extends AdminManageInquiry {
  content: string;
  updatedAt: string;
  adminId: number;
  requestTitle: string;
  requestContent: string;
}

export type AdminInquiryAnswer = Pick<
  AdminInquiryPostProps,
  "title" | "content"
>;

export type ManageInquiryProps = AdminPagination<AdminManageInquiry>;
