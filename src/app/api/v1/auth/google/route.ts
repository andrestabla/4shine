import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { issueAuthTokens } from '@/server/auth/session';
import { setAuthCookies } from '@/server/auth/cookies';
import type { AuthUser } from '@/server/auth/types';

interface GoogleBody {
  credential?: string;
}

interface GoogleTokenInfo {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  aud?: string;
  exp?: string;
}

function getIpAddress(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (!fwd) return null;
  return fwd.split(',')[0]?.trim() ?? null;
}

export async function POST(request: Request) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return NextResponse.json({ ok: false, error: 'Google SSO no configurado' }, { status: 503 });
  }

  let body: GoogleBody;
  try {
    body = (await request.json()) as GoogleBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.credential) {
    return NextResponse.json({ ok: false, error: 'Falta el token de Google' }, { status: 400 });
  }

  let tokenInfo: GoogleTokenInfo;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.credential)}`,
    );
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'Token de Google inválido' }, { status: 401 });
    }
    tokenInfo = (await res.json()) as GoogleTokenInfo;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Error al verificar token de Google' },
      { status: 500 },
    );
  }

  if (tokenInfo.aud !== googleClientId) {
    return NextResponse.json({ ok: false, error: 'Token de Google inválido' }, { status: 401 });
  }
  if (!tokenInfo.email) {
    return NextResponse.json(
      { ok: false, error: 'No se pudo obtener el correo de Google' },
      { status: 400 },
    );
  }
  if (Number(tokenInfo.exp) * 1000 < Date.now()) {
    return NextResponse.json({ ok: false, error: 'Token de Google expirado' }, { status: 401 });
  }

  const email = tokenInfo.email.trim().toLowerCase();
  const nameParts = (tokenInfo.name ?? '').split(' ');
  const firstName = tokenInfo.given_name?.trim() ?? nameParts[0]?.trim() ?? '';
  const lastName = tokenInfo.family_name?.trim() ?? nameParts.slice(1).join(' ').trim() ?? '';

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

        const { rows } = await client.query<{
          user_id: string;
          email: string;
          display_name: string;
          primary_role: AuthUser['role'];
          is_active: boolean;
          email_verified_at: string | null;
          privacy_policy_accepted_at: string | null;
        }>(
          `
            SELECT u.user_id, u.email, u.display_name, u.primary_role, u.is_active,
                   uc.email_verified_at::text,
                   lpa.accepted_at::text AS privacy_policy_accepted_at
            FROM app_core.users u
            JOIN app_auth.user_credentials uc ON uc.user_id = u.user_id
            LEFT JOIN LATERAL (
              SELECT accepted_at
              FROM app_auth.user_policy_acceptances
              WHERE user_id = u.user_id AND policy_code = 'privacy_policy'
              ORDER BY accepted_at DESC LIMIT 1
            ) lpa ON true
            WHERE u.email = $1
            LIMIT 1
          `,
          [email],
        );

        const userRow = rows[0];

        if (!userRow) {
          await client.query('COMMIT');
          return {
            status: 200 as const,
            payload: {
              ok: true,
              action: 'register' as const,
              email,
              firstName,
              lastName,
            },
          };
        }

        if (!userRow.is_active) {
          await client.query('COMMIT');
          return {
            status: 403 as const,
            payload: { ok: false, error: 'Cuenta inactiva. Contacta al administrador.' },
          };
        }

        if (!userRow.email_verified_at) {
          await client.query('COMMIT');
          return {
            status: 403 as const,
            payload: { ok: false, error: 'email_not_verified', email: userRow.email },
          };
        }

        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_user_id',
          userRow.user_id,
        ]);
        await client.query('SELECT set_config($1, $2, true)', [
          'app.current_role',
          userRow.primary_role,
        ]);

        const authUser: AuthUser = {
          userId: userRow.user_id,
          email: userRow.email,
          name: userRow.display_name,
          role: userRow.primary_role,
        };

        const tokens = await issueAuthTokens(
          client,
          authUser,
          request.headers.get('user-agent'),
          getIpAddress(request),
        );

        await client.query('COMMIT');

        return {
          status: 200 as const,
          payload: {
            ok: true,
            action: 'login' as const,
            user: {
              id: authUser.userId,
              email: authUser.email,
              name: authUser.name,
              role: authUser.role,
              privacyPolicyAccepted: !!userRow.privacy_policy_accepted_at,
            },
          },
          tokens,
        };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });

    const response = NextResponse.json(result.payload, { status: result.status });
    if ('tokens' in result && result.tokens) {
      setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    }
    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: 'Error al autenticar con Google', detail },
      { status: 500 },
    );
  }
}
