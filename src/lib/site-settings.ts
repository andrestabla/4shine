import { withClient } from '@/server/db/pool';

const DEFAULT_PAGES: Record<string, boolean> = {
  home: true,
  descubrimiento: true,
  metodologia: true,
  planes_precios: true,
  afiliados: true,
};

export async function getSitePages(): Promise<Record<string, boolean>> {
  try {
    const row = await withClient(async (client) => {
      const { rows } = await client.query<{
        wizard_data: { pages?: Record<string, boolean> } | null;
      }>(
        `SELECT ic.wizard_data
         FROM app_admin.integration_configs ic
         JOIN app_core.organizations o ON o.organization_id = ic.organization_id
         WHERE ic.integration_key = 'site_pages'
         ORDER BY o.created_at
         LIMIT 1`,
      );
      return rows[0] ?? null;
    });
    return row?.wizard_data?.pages ?? DEFAULT_PAGES;
  } catch {
    return DEFAULT_PAGES;
  }
}
