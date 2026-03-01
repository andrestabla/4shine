import type { NextResponse } from 'next/server';
import { authConfig } from './config';

export const ACCESS_COOKIE = 'auth_access_token';
export const REFRESH_COOKIE = 'auth_refresh_token';

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): void {
  response.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(authConfig.accessTtlSeconds));
  response.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(authConfig.refreshTtlSeconds));
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
}

export function parseCookieValue(request: Request, cookieName: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;

  const cookieParts = header.split(';');
  for (const part of cookieParts) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === cookieName) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}
