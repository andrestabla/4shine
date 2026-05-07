import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity || !['admin', 'gestor'].includes(identity.role)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);
        const { rows } = await client.query<{ wizard_data: Record<string, string> | null }>(
          `SELECT wizard_data
           FROM app_admin.integration_configs
           WHERE integration_key = 'privacy_policy'
           LIMIT 1`,
        );
        await client.query('COMMIT');
        return rows[0]?.wizard_data ?? null;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });
    return NextResponse.json({ ok: true, wizardData: result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al cargar política', detail }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity || !['admin', 'gestor'].includes(identity.role)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { version?: string; content?: string };
  try {
    body = (await request.json()) as { version?: string; content?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const version = body.version?.trim();
  const content = body.content?.trim();

  if (!version || !content) {
    return NextResponse.json({ ok: false, error: 'version y content son requeridos' }, { status: 400 });
  }

  try {
    await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);
        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', identity.userId]);
        await client.query(
          `INSERT INTO app_admin.integration_configs (integration_key, enabled, wizard_data)
           VALUES ('privacy_policy', true, $1::jsonb)
           ON CONFLICT (integration_key)
           DO UPDATE SET wizard_data = $1::jsonb, updated_at = now()`,
          [JSON.stringify({ version, content })],
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
    return NextResponse.json({ ok: false, error: 'Error al guardar política', detail }, { status: 500 });
  }
}
