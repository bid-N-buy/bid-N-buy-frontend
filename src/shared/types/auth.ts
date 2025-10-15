export interface TokenInfo {
  grantType: "Bearer";
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresIn?: number;
}

/** 서버가 nickname/email을 함께 내려줄 수도, 안 내려줄 수도 있으니 선택적(옵셔널) */
export interface LoginResponse {
  tokenInfo: TokenInfo;
  nickname?: string;
  email?: string;
}

export interface ReissueResponse {
  tokenInfo: TokenInfo;
  nickname?: string;
  email?: string;
}

/** 레거시(top-level) 대응용 */
export interface LegacyTokenResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface ReissueRequest {
  /** 서버 컨트롤러가 refreshToken만 받으므로 이 한 개만 필요 */
  refreshToken: string;
}
