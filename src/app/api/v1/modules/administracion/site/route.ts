import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient } from '@/server/db/pool';

interface SiteSettingsRow {
  wizard_data: { pages?: Record<string, boolean> } | null;
}

const ALLOWED_PAGE_KEYS = new Set(['home', 'descubrimiento', 'metodologia', 'planes_precios', 'afiliados']);

const DEFAULT_PAGES: Record<string, boolean> = {
  home: true,
  descubrimiento: true,
  metodologia: true,
  planes_precios: true,
  afiliados: true,
};

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const row = await withClient(async (client) => {
      const { rows } = await client.query<SiteSettingsRow>(
        `SELECT wizard_data FROM app_admin.integration_configs WHERE integration_key = 'site_pages' LIMIT 1`,
      );
      return rows[0] ?? null;
    });

    const pages = row?.wizard_data?.pages ?? DEFAULT_PAGES;
    return NextResponse.json({ ok: true, pages });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al cargar configuración del sitio', detail }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { pages?: Record<string, boolean> };
  try {
    body = (await request.json()) as { pages?: Record<string, boolean> };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const rawPages = body.pages;
  if (!rawPages || typeof rawPages !== 'object' || Array.isArray(rawPages)) {
    return NextResponse.json({ ok: false, error: 'pages es requerido' }, { status: 400 });
  }

  // Only keep known keys with boolean values
  const pages: Record<string, boolean> = {};
  for (const key of ALLOWED_PAGE_KEYS) {
    pages[key] = rawPages[key] !== false;
  }

  try {
    await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);
        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', identity.userId]);
        await client.query(
          `INSERT INTO app_admin.integration_configs (integration_key, enabled, wizard_data)
           VALUES ('site_pages', true, $1::jsonb)
           ON CONFLICT (integration_key)
           DO UPDATE SET wizard_data = $1::jsonb, updated_at = now()`,
          [JSON.stringify({ pages })],
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
    return NextResponse.json({ ok: false, error: 'Error al guardar configuración del sitio', detail }, { status: 500 });
  }
}
