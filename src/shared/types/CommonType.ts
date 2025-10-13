export interface UserProps {
  userId: string;
  adminId?: string;
  email: string;
  password: string;
  nickname: string;
  authStatus?: string;
  userStatus?: string;
  userType?: string;
  deletedAt?: number;
}

export interface ImageProps {
  imageId: string;
  auctionId?: string;
  userId?: UserProps["userId"];
  imageUrl: string;
  imageType?: string;
}
export interface AvatarProps {
  imageUrl: ImageProps["imageUrl"];
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
