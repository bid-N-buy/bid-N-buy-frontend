import type { AuctionItem } from "../../features/auction/types/auctions";

export interface UserProps {
  userId: number;
  adminId?: number;
  email: string;
  password: string;
  nickname: string;
  profile_image_url: string | null;
  authStatus?: string;
  userStatus?: string;
  userType?: string;
  deletedAt?: number;
}

export interface ImageProps {
  imageId: number;
  auctionId?: AuctionItem["auctionId"];
  userId?: UserProps["userId"];
  imageUrl: string;
  imageType?: string;
}
export interface AvatarProps {
  imageUrl: string | null | undefined;
  nickname?: string;
  size?: string;
}

export interface ModalProps {
  isChatOpen?: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export interface LoginResponse {
  email?: string;
  nickname?: string;
  tokenInfo: {
    accessToken: string;
    refreshToken: string;
    grantType: "Bearer";
    accessTokenExpiresIn: number;
  };
}

export interface ReissueRequest {
  accesstoken: string; // 서버 스펙: 소문자 키
  refreshtoken: string; // 서버 스펙: 소문자 키
}

export interface ReissueResponse {
  tokenInfo: {
    accessToken: string;
    refreshToken: string;
    grantType: "Bearer";
    accessTokenExpiresIn: number;
  };
}

export interface ErrorResponse {
  message?: string;
}
