import type { Role } from '@/server/bootstrap/types';

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  guestScope?: 'descubrimiento';
  inviteToken?: string;
}

export interface AccessTokenClaims {
  sub: string;
  email: string;
  name: string;
  role: Role;
  tokenType: 'access';
  guestScope?: 'descubrimiento';
  inviteToken?: string;
}

export interface GuestAccessTokenClaims {
  sub: string;
  email: string;
  name: string;
  role: Role;
  tokenType: 'guest_access';
  guestScope: 'descubrimiento';
  inviteToken: string;
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
