import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';

export async function GET() {
  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

        const { rows } = await client.query<{
          enabled: boolean;
          wizard_data: Record<string, string> | null;
        }>(
          `SELECT enabled, wizard_data
           FROM app_admin.integration_configs
           WHERE integration_key = 'google_sso'
           LIMIT 1`,
        );

        await client.query('COMMIT');

        const row = rows[0];
        if (!row || !row.enabled) {
          return { googleSso: { enabled: false, clientId: null } };
        }

        const clientId = row.wizard_data?.clientId ?? null;
        return { googleSso: { enabled: true, clientId: clientId || null } };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    return response;
  } catch {
    return NextResponse.json({ googleSso: { enabled: false, clientId: null } });
  }
}
