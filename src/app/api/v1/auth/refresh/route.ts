import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { parseCookieValue, REFRESH_COOKIE, setAuthCookies, clearAuthCookies } from '@/server/auth/cookies';
import { rotateFromRefreshToken } from '@/server/auth/session';
import { buildRequestSummary, recordAuditEvent } from '@/server/audit/service';

interface RefreshBody {
  refreshToken?: string;
}

function getIpAddress(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (!fwd) return null;
  return fwd.split(',')[0]?.trim() ?? null;
}

export async function POST(request: Request) {
  let body: RefreshBody = {};

  try {
    body = (await request.json()) as RefreshBody;
  } catch {
    body = {};
  }

  const refreshToken = body.refreshToken ?? parseCookieValue(request, REFRESH_COOKIE);

  if (!refreshToken) {
    try {
      await recordAuditEvent({
        action: 'auth_refresh_missing_token',
        entityTable: 'app_auth.refresh_sessions',
        changeSummary: buildRequestSummary(request),
      });
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }

    const response = NextResponse.json({ ok: false, error: 'Refresh token is required' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const rotated = await rotateFromRefreshToken(
          client,
          refreshToken,
          request.headers.get('user-agent'),
          getIpAddress(request),
        );
        await client.query('COMMIT');
        return rotated;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    const response = NextResponse.json(
      {
        ok: true,
        user: {
          id: result.user.userId,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      },
      { status: 200 },
    );

    setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);

    try {
      await recordAuditEvent(
        {
          action: 'auth_refresh_success',
          entityTable: 'app_auth.refresh_sessions',
          changeSummary: buildRequestSummary(request, { sessionUserId: result.user.userId }),
        },
        result.user,
      );
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }

    return response;
  } catch {
    try {
      await recordAuditEvent({
        action: 'auth_refresh_failed',
        entityTable: 'app_auth.refresh_sessions',
        changeSummary: buildRequestSummary(request),
      });
    } catch (auditError) {
      console.error('Audit log failed', auditError);
    }

    const response = NextResponse.json({ ok: false, error: 'Invalid refresh token' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }
}
