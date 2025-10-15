import type { AuctionResponse } from "../../features/auction/types/product";

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
  auctionId?: AuctionResponse["auctionId"];
  userId?: UserProps["userId"];
  imageUrl: string;
  imageType?: string;
}
export interface AvatarProps {
  imageUrl: UserProps["profile_image_url"];
  nickname?: UserProps["nickname"];
}

export const profile_default =
  "https://img.daisyui.com/images/profile/demo/yellingcat@192.webp";

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
