import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', identity.userId]);
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', identity.role]);
        await client.query(
          `INSERT INTO app_auth.user_policy_acceptances (user_id, policy_code, policy_version)
           VALUES ($1, 'privacy_policy', '2026-05-07')
           ON CONFLICT (user_id, policy_code, policy_version) DO NOTHING`,
          [identity.userId],
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al registrar aceptación', detail }, { status: 500 });
  }
}
