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
      const { rows } = await client.query<SiteSettingsRow>(
        `SELECT wizard_data FROM app_admin.integration_configs WHERE integration_key = 'site_pages' LIMIT 1`,
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
