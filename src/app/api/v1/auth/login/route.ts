import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { verifyPassword } from '@/server/auth/password';
import { authConfig } from '@/server/auth/config';
import { issueAuthTokens } from '@/server/auth/session';
import { setAuthCookies } from '@/server/auth/cookies';
import type { AuthUser } from '@/server/auth/types';

interface LoginBody {
  email?: string;
  password?: string;
}

function getIpAddress(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (!fwd) return null;
  return fwd.split(',')[0]?.trim() ?? null;
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 });
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const { rows } = await client.query<{
          user_id: string;
          email: string;
          display_name: string;
          primary_role: AuthUser['role'];
          password_hash: string;
          failed_attempts: number;
          locked_until: string | null;
          is_active: boolean;
        }>(
          `
            SELECT
              u.user_id,
              u.email,
              u.display_name,
              u.primary_role,
              uc.password_hash,
              uc.failed_attempts,
              uc.locked_until::text,
              u.is_active
            FROM app_core.users u
            JOIN app_auth.user_credentials uc ON uc.user_id = u.user_id
            WHERE u.email = $1
            LIMIT 1
          `,
          [email],
        );

        const authRow = rows[0];

        if (!authRow || !authRow.is_active) {
          await client.query('ROLLBACK');
          return { status: 401 as const, payload: { ok: false, error: 'Invalid credentials' } };
        }

        if (authRow.locked_until && new Date(authRow.locked_until).getTime() > Date.now()) {
          await client.query('ROLLBACK');
          return {
            status: 423 as const,
            payload: {
              ok: false,
              error: 'Account temporarily locked due to multiple failed attempts',
            },
          };
        }

        const isValid = await verifyPassword(password, authRow.password_hash);

        if (!isValid) {
          const nextAttempts = authRow.failed_attempts + 1;
          const shouldLock = nextAttempts >= authConfig.lockMaxAttempts;

          await client.query(
            `
              UPDATE app_auth.user_credentials
              SET
                failed_attempts = $2,
                locked_until = CASE
                  WHEN $3 THEN now() + ($4 || ' minutes')::interval
                  ELSE NULL
                END,
                updated_at = now()
              WHERE user_id = $1
            `,
            [authRow.user_id, nextAttempts, shouldLock, authConfig.lockMinutes],
          );

          await client.query('COMMIT');

          return { status: 401 as const, payload: { ok: false, error: 'Invalid credentials' } };
        }

        await client.query(
          `
            UPDATE app_auth.user_credentials
            SET
              failed_attempts = 0,
              locked_until = NULL,
              updated_at = now()
            WHERE user_id = $1
          `,
          [authRow.user_id],
        );

        const user: AuthUser = {
          userId: authRow.user_id,
          email: authRow.email,
          name: authRow.display_name,
          role: authRow.primary_role,
        };

        const tokens = await issueAuthTokens(
          client,
          user,
          request.headers.get('user-agent'),
          getIpAddress(request),
        );

        await client.query('COMMIT');

        return {
          status: 200 as const,
          payload: {
            ok: true,
            user: {
              id: user.userId,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          },
          tokens,
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    const response = NextResponse.json(result.payload, { status: result.status });

    if (result.status === 200 && 'tokens' in result) {
      setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    }

    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: 'Login failed', detail },
      { status: 500 },
    );
  }
}
