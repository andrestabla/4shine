import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { clearAuthCookies, parseCookieValue, REFRESH_COOKIE } from '@/server/auth/cookies';
import { revokeFromRefreshToken } from '@/server/auth/session';

export async function POST(request: Request) {
  const refreshToken = parseCookieValue(request, REFRESH_COOKIE);

  if (refreshToken) {
    await withClient(async (client) => {
      await revokeFromRefreshToken(client, refreshToken);
    });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearAuthCookies(response);
  return response;
}
