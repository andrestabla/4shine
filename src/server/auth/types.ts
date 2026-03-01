import type { Role } from '@/server/bootstrap/types';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface AccessTokenClaims {
  sub: string;
  email: string;
  name: string;
  role: Role;
  tokenType: 'access';
}

export interface RefreshTokenClaims {
  sub: string;
  email: string;
  name: string;
  role: Role;
  tokenType: 'refresh';
  sessionId: string;
}

export interface AuthSessionTokens {
  accessToken: string;
  refreshToken: string;
}
