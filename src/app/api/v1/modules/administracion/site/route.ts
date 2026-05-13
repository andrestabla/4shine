import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { PoolClient } from 'pg';

const ALLOWED_PAGE_KEYS = new Set(['home', 'descubrimiento', 'metodologia', 'planes_precios', 'afiliados']);

const DEFAULT_PAGES: Record<string, boolean> = {
  home: true,
  descubrimiento: true,
  metodologia: true,
  planes_precios: true,
  afiliados: true,
};

async function resolveOrganizationId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<{ organization_id: string }>(
    `SELECT u.organization_id::text FROM app_core.users u WHERE u.user_id = $1 LIMIT 1`,
    [userId],
  );
  if (rows[0]?.organization_id) return rows[0].organization_id;

  const { rows: orgRows } = await client.query<{ organization_id: string }>(
    `SELECT o.organization_id::text FROM app_core.organizations o ORDER BY o.created_at LIMIT 1`,
  );
  if (!orgRows[0]?.organization_id) throw new Error('No organization found');
  return orgRows[0].organization_id;
}

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity || identity.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pages = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const organizationId = await resolveOrganizationId(client, identity.userId);
        const { rows } = await client.query<{ wizard_data: { pages?: Record<string, boolean> } | null }>(
          `SELECT wizard_data FROM app_admin.integration_configs
           WHERE organization_id = $1::uuid AND integration_key = 'site_pages'
           LIMIT 1`,
          [organizationId],
        );
        return rows[0]?.wizard_data?.pages ?? DEFAULT_PAGES;
      }),
    );

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

  // Only keep known keys
  const pages: Record<string, boolean> = {};
  for (const key of ALLOWED_PAGE_KEYS) {
    pages[key] = rawPages[key] !== false;
  }

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const organizationId = await resolveOrganizationId(client, identity.userId);
        await client.query(
          `INSERT INTO app_admin.integration_configs
             (organization_id, integration_key, label, provider, enabled, wizard_data, created_by, updated_by)
           VALUES ($1::uuid, 'site_pages', 'Site Pages', 'system', true, $2::jsonb, $3::uuid, $3::uuid)
           ON CONFLICT (organization_id, integration_key) DO UPDATE
           SET wizard_data = EXCLUDED.wizard_data,
               updated_by  = EXCLUDED.updated_by,
               updated_at  = now()`,
          [organizationId, JSON.stringify({ pages }), identity.userId],
        );
      }),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: 'Error al guardar configuración del sitio', detail }, { status: 500 });
  }
}
