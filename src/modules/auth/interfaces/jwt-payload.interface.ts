export interface JwtPayload {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  userId: number;
  username: string;
}
