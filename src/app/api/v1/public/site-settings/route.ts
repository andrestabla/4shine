import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';

interface SiteSettingsRow {
  wizard_data: { pages?: Record<string, boolean> } | null;
}

const DEFAULT_PAGES: Record<string, boolean> = {
  home: true,
  descubrimiento: true,
  metodologia: true,
  planes_precios: true,
  afiliados: true,
};

export async function GET() {
  try {
    const row = await withClient(async (client) => {
      // Pick from the first/only organization (single-tenant platform)
      const { rows } = await client.query<SiteSettingsRow>(
        `SELECT ic.wizard_data
         FROM app_admin.integration_configs ic
         JOIN app_core.organizations o ON o.organization_id = ic.organization_id
         WHERE ic.integration_key = 'site_pages'
         ORDER BY o.created_at
         LIMIT 1`,
      );
      return rows[0] ?? null;
    });

    const pages = row?.wizard_data?.pages ?? DEFAULT_PAGES;
    const response = NextResponse.json({ ok: true, pages });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch {
    const response = NextResponse.json({ ok: true, pages: DEFAULT_PAGES });
    response.headers.set('Cache-Control', 'public, s-maxage=10');
    return response;
  }
}
