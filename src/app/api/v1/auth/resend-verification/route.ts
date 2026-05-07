import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { sendVerificationEmail } from '@/features/usuarios/service';

interface ResendBody {
  email?: string;
}

// Minimum gap between resend attempts (2 minutes).
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export async function POST(request: Request) {
  let body: ResendBody;
  try {
    body = (await request.json()) as ResendBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: 'Correo requerido' }, { status: 400 });
  }

  try {
    await withClient(async (client) => {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

      const { rows } = await client.query<{
        user_id: string;
        first_name: string;
        organization_id: string | null;
        email_verified_at: string | null;
        email_verification_expires_at: string | null;
      }>(
        `
          SELECT
            u.user_id::text,
            u.first_name,
            u.organization_id::text,
            uc.email_verified_at::text,
            uc.email_verification_expires_at::text
          FROM app_core.users u
          JOIN app_auth.user_credentials uc ON uc.user_id = u.user_id
          WHERE u.email = $1 AND u.is_active = true
          LIMIT 1
        `,
        [email],
      );

      const row = rows[0];
      // Silently succeed if user not found to avoid email enumeration.
      if (!row) return;

      // Already verified — nothing to do.
      if (row.email_verified_at) return;

      // Enforce cooldown: if the current token is still fresh, don't resend.
      if (row.email_verification_expires_at) {
        const expiresAt = new Date(row.email_verification_expires_at).getTime();
        const issuedAt = expiresAt - 24 * 60 * 60 * 1000;
        if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) return;
      }

      await sendVerificationEmail(row.user_id, email, row.first_name, row.organization_id);
    });

    // Always return success to avoid email enumeration.
    return NextResponse.json({
      ok: true,
      message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace.',
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al reenviar verificación', detail }, { status: 500 });
  }
}
