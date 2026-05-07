import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { issueAuthTokens } from '@/server/auth/session';
import { setAuthCookies } from '@/server/auth/cookies';
import type { AuthUser } from '@/server/auth/types';

function getIpAddress(request: Request): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (!fwd) return null;
  return fwd.split(',')[0]?.trim() ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token requerido' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  try {
    const result = await withClient(async (client) => {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

      const { rows } = await client.query<{
        user_id: string;
        email: string;
        display_name: string;
        primary_role: AuthUser['role'];
        is_active: boolean;
        expires_at: string | null;
        already_verified: boolean;
        privacy_policy_accepted_at: string | null;
      }>(
        `
          SELECT
            u.user_id::text,
            u.email::text,
            u.display_name,
            u.primary_role,
            u.is_active,
            uc.email_verification_expires_at::text AS expires_at,
            (uc.email_verified_at IS NOT NULL) AS already_verified,
            lpa.accepted_at::text AS privacy_policy_accepted_at
          FROM app_auth.user_credentials uc
          JOIN app_core.users u ON u.user_id = uc.user_id
          LEFT JOIN LATERAL (
            SELECT accepted_at
            FROM app_auth.user_policy_acceptances
            WHERE user_id = u.user_id AND policy_code = 'privacy_policy'
            ORDER BY accepted_at DESC LIMIT 1
          ) lpa ON true
          WHERE uc.email_verification_token = $1
          LIMIT 1
        `,
        [tokenHash],
      );

      const row = rows[0];

      if (!row) {
        return { status: 400 as const, payload: { ok: false, error: 'El enlace de verificación es inválido o ya fue utilizado.' } };
      }

      if (row.already_verified) {
        return { status: 400 as const, payload: { ok: false, error: 'Esta cuenta ya fue verificada. Puedes iniciar sesión.' } };
      }

      if (!row.is_active) {
        return { status: 403 as const, payload: { ok: false, error: 'Cuenta inactiva.' } };
      }

      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
        return { status: 410 as const, payload: { ok: false, error: 'El enlace expiró. Solicita uno nuevo desde la pantalla de acceso.' } };
      }

      await client.query(
        `
          UPDATE app_auth.user_credentials
          SET email_verified_at = now(),
              email_verification_token = NULL,
              email_verification_expires_at = NULL
          WHERE user_id = $1
        `,
        [row.user_id],
      );

      await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', row.user_id]);
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', row.primary_role]);

      const authUser: AuthUser = {
        userId: row.user_id,
        email: row.email,
        name: row.display_name,
        role: row.primary_role,
      };

      const tokens = await issueAuthTokens(
        client,
        authUser,
        request.headers.get('user-agent'),
        getIpAddress(request),
      );

      return {
        status: 200 as const,
        payload: {
          ok: true,
          user: {
            id: authUser.userId,
            email: authUser.email,
            name: authUser.name,
            role: authUser.role,
            privacyPolicyAccepted: !!row.privacy_policy_accepted_at,
          },
        },
        tokens,
      };
    });

    const response = NextResponse.json(result.payload, { status: result.status });
    if ('tokens' in result && result.tokens) {
      setAuthCookies(response, result.tokens.accessToken, result.tokens.refreshToken);
    }
    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al verificar la cuenta', detail }, { status: 500 });
  }
}
