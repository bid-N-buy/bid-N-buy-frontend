export interface UserProps {
  user_id: string;
  admin_id?: string;
  email: string;
  password: string;
  nickname: string;
  auth_status?: string;
  user_status?: string;
  user_type?: string;
  deleted_at?: number;
}

export interface ImageProps {
  image_id: string;
  auction_id?: string;
  user_id?: UserProps["user_id"];
  image_url: string;
  image_type?: string;
}
export interface AvatarProps {
  image_url: ImageProps["image_url"];
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
