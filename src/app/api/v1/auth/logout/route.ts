import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { clearAuthCookies, parseCookieValue, REFRESH_COOKIE } from '@/server/auth/cookies';
import { revokeFromRefreshToken } from '@/server/auth/session';
import { authenticateRequest } from '@/server/auth/request-auth';
import { buildRequestSummary, recordAuditEvent } from '@/server/audit/service';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  const refreshToken = parseCookieValue(request, REFRESH_COOKIE);

  if (refreshToken) {
    await withClient(async (client) => {
      await revokeFromRefreshToken(client, refreshToken);
    });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearAuthCookies(response);

  try {
    await recordAuditEvent(
      {
        action: 'auth_logout',
        entityTable: 'app_auth.refresh_sessions',
        changeSummary: buildRequestSummary(request),
      },
      identity,
    );
  } catch (auditError) {
    console.error('Audit log failed', auditError);
  }

  return response;
}
