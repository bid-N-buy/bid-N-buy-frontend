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

export interface AdminManageAuction {
  // 실제 경매 상품 목록 배열
  data: AuctionItem[];

  // 페이징 정보
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

interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

interface PageableInfo {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface ManageUserProps {
  content: AdminManageUser[]; // 실제 사용자 객체 목록 배열
  pageable: PageableInfo; // 페이지 처리 정보
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: Sort; // 최상위의 Sort 정보 (pageable.sort와 중복되지만 API가 제공)
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

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
