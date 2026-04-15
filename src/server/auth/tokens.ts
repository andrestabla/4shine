import { SignJWT, jwtVerify } from 'jose';
import { authConfig, getAccessSecret, getRefreshSecret } from './config';
import type { AccessTokenClaims, AuthUser, GuestAccessTokenClaims, RefreshTokenClaims } from './types';

const encoder = new TextEncoder();
let accessSecretBytes: Uint8Array | null = null;
let refreshSecretBytes: Uint8Array | null = null;

function getAccessSecretBytes(): Uint8Array {
  if (!accessSecretBytes) {
    accessSecretBytes = encoder.encode(getAccessSecret());
  }

  return accessSecretBytes;
}

function getRefreshSecretBytes(): Uint8Array {
  if (!refreshSecretBytes) {
    refreshSecretBytes = encoder.encode(getRefreshSecret());
  }

  return refreshSecretBytes;
}

export async function signAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    tokenType: 'access',
    ...(user.guestScope ? { guestScope: user.guestScope } : {}),
    ...(user.inviteToken ? { inviteToken: user.inviteToken } : {}),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setSubject(user.userId)
    .setExpirationTime(`${authConfig.accessTtlSeconds}s`)
    .sign(getAccessSecretBytes());
}

export async function signGuestAccessToken(input: {
  inviteToken: string;
  email: string;
  name: string;
  role?: AuthUser['role'];
}): Promise<string> {
  const role = input.role ?? 'gestor';
  const userId = `invited:${input.inviteToken}`;
  return new SignJWT({
    email: input.email,
    name: input.name,
    role,
    tokenType: 'guest_access',
    guestScope: 'descubrimiento',
    inviteToken: input.inviteToken,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setSubject(userId)
    .setExpirationTime(`${authConfig.accessTtlSeconds}s`)
    .sign(getAccessSecretBytes());
}

export async function signRefreshToken(user: AuthUser, sessionId: string): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    tokenType: 'refresh',
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setSubject(user.userId)
    .setExpirationTime(`${authConfig.refreshTtlSeconds}s`)
    .sign(getRefreshSecretBytes());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, getAccessSecretBytes(), {
    algorithms: ['HS256'],
  });

  if (payload.tokenType !== 'access' || !payload.sub || !payload.email || !payload.role || !payload.name) {
    throw new Error('Invalid access token claims');
  }

  return {
    sub: payload.sub,
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role as AccessTokenClaims['role'],
    tokenType: 'access',
    guestScope:
      payload.guestScope === 'descubrimiento' ? 'descubrimiento' : undefined,
    inviteToken: payload.inviteToken ? String(payload.inviteToken) : undefined,
  };
}

export async function verifyGuestAccessToken(token: string): Promise<GuestAccessTokenClaims> {
  const { payload } = await jwtVerify(token, getAccessSecretBytes(), {
    algorithms: ['HS256'],
  });

  if (
    payload.tokenType !== 'guest_access' ||
    !payload.sub ||
    !payload.email ||
    !payload.role ||
    !payload.name ||
    payload.guestScope !== 'descubrimiento' ||
    !payload.inviteToken
  ) {
    throw new Error('Invalid guest access token claims');
  }

  return {
    sub: payload.sub,
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role as GuestAccessTokenClaims['role'],
    tokenType: 'guest_access',
    guestScope: 'descubrimiento',
    inviteToken: String(payload.inviteToken),
  };
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  const { payload } = await jwtVerify(token, getRefreshSecretBytes(), {
    algorithms: ['HS256'],
  });

  if (
    payload.tokenType !== 'refresh' ||
    !payload.sub ||
    !payload.email ||
    !payload.role ||
    !payload.name ||
    !payload.sessionId
  ) {
    throw new Error('Invalid refresh token claims');
  }

  return {
    sub: payload.sub,
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role as RefreshTokenClaims['role'],
    tokenType: 'refresh',
    sessionId: String(payload.sessionId),
  };
}
