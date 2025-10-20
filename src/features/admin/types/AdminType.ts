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
