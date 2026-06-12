import { withClient } from '@/server/db/pool';

const DEFAULT_PAGES: Record<string, boolean> = {
  home: true,
  descubrimiento: true,
  metodologia: true,
  planes_precios: true,
  afiliados: true,
};

/**
 * Visibilidad de páginas públicas por page_key.
 * Lee de app_admin.site_pages (site builder); si la tabla aún no existe,
 * cae al config legado en integration_configs.
 */
export async function getSitePages(): Promise<Record<string, boolean>> {
  try {
    const rows = await withClient(async (client) => {
      const { rows } = await client.query<{ page_key: string; is_visible: boolean }>(
        `SELECT sp.page_key, sp.is_visible
         FROM app_admin.site_pages sp
         JOIN app_core.organizations o ON o.organization_id = sp.organization_id
         ORDER BY o.created_at`,
      );
      return rows;
    });
    if (rows.length > 0) {
      const pages: Record<string, boolean> = { ...DEFAULT_PAGES };
      for (const row of rows) pages[row.page_key] = row.is_visible;
      return pages;
    }
  } catch {
    // tabla aún no migrada — usar config legado
  }

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
