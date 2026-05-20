import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token')?.trim();

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token requerido' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

        const { rows } = await client.query<{
          user_id: string;
          is_active: boolean;
          expires_at: string | null;
          already_verified: boolean;
        }>(
          `
            SELECT
              u.user_id::text,
              u.is_active,
              uc.email_verification_expires_at::text AS expires_at,
              (uc.email_verified_at IS NOT NULL) AS already_verified
            FROM app_auth.user_credentials uc
            JOIN app_core.users u ON u.user_id = uc.user_id
            WHERE uc.email_verification_token = $1
            LIMIT 1
          `,
          [tokenHash],
        );

        const row = rows[0];

        if (!row) {
          await client.query('ROLLBACK');
          return { status: 400 as const, payload: { ok: false, error: 'El enlace de verificación es inválido o ya fue utilizado.' } };
        }

        if (row.already_verified) {
          await client.query('ROLLBACK');
          return { status: 400 as const, payload: { ok: false, error: 'Esta cuenta ya fue verificada. Puedes iniciar sesión.' } };
        }

        if (!row.is_active) {
          await client.query('ROLLBACK');
          return { status: 403 as const, payload: { ok: false, error: 'Cuenta inactiva.' } };
        }

        if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
          await client.query('ROLLBACK');
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

        await client.query('COMMIT');

        return { status: 200 as const, payload: { ok: true } };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });

    return NextResponse.json(result.payload, { status: result.status });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al verificar la cuenta', detail }, { status: 500 });
  }
}
