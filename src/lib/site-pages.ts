import { withClient } from '@/server/db/pool';
import { sanitizeSections } from '@/features/site-builder/service';
import type { SiteBlock, SitePageSeo } from '@/features/site-builder/types';

export interface PublicSitePage {
  pageKey: string;
  title: string;
  slug: string;
  navLabel: string;
  isVisible: boolean;
  useBuilder: boolean;
  sections: SiteBlock[];
  seo: SitePageSeo;
}

export interface PublicNavItem {
  href: string;
  label: string;
  pageKey: string;
}

interface PublicPageRow {
  page_key: string;
  title: string;
  slug: string;
  nav_label: string;
  show_in_nav: boolean;
  is_visible: boolean;
  use_builder: boolean;
  sections: unknown;
  seo: unknown;
}

function mapRow(row: PublicPageRow): PublicSitePage {
  const seoRaw = row.seo && typeof row.seo === 'object' && !Array.isArray(row.seo) ? (row.seo as Record<string, unknown>) : {};
  return {
    pageKey: row.page_key,
    title: row.title,
    slug: row.slug,
    navLabel: row.nav_label || row.title,
    isVisible: row.is_visible,
    useBuilder: row.use_builder,
    sections: sanitizeSections(row.sections),
    seo: {
      metaTitle: typeof seoRaw.metaTitle === 'string' ? seoRaw.metaTitle : undefined,
      metaDescription: typeof seoRaw.metaDescription === 'string' ? seoRaw.metaDescription : undefined,
    },
  };
}

const PUBLIC_COLUMNS = `page_key, title, slug, nav_label, show_in_nav, is_visible, use_builder, sections, seo`;

/** Items de navegación del sitio público (páginas visibles marcadas para nav). */
export async function listPublicNavItems(): Promise<PublicNavItem[]> {
  try {
    const rows = await withClient(async (client) => {
      const { rows } = await client.query<PublicPageRow>(
        `SELECT ${PUBLIC_COLUMNS}
         FROM app_admin.site_pages sp
         JOIN app_core.organizations o ON o.organization_id = sp.organization_id
         WHERE sp.is_visible = true AND sp.show_in_nav = true AND sp.slug <> ''
         ORDER BY o.created_at, sp.nav_order, sp.created_at`,
      );
      return rows;
    });
    return rows.map((row) => ({
      href: `/${row.slug}`,
      label: row.nav_label || row.title,
      pageKey: row.page_key,
    }));
  } catch {
    // Fallback si la migración aún no se aplica
    return [
      { href: '/metodologia', label: 'Metodología', pageKey: 'metodologia' },
      { href: '/descubrimiento', label: 'Descubrimiento', pageKey: 'descubrimiento' },
      { href: '/planes-precios', label: 'Planes y precios', pageKey: 'planes_precios' },
      { href: '/advisers', label: 'Afiliados', pageKey: 'afiliados' },
    ];
  }
}

/** Página pública por slug (para rutas dinámicas del builder). */
export async function getPublicPageBySlug(slug: string): Promise<PublicSitePage | null> {
  try {
    const row = await withClient(async (client) => {
      const { rows } = await client.query<PublicPageRow>(
        `SELECT ${PUBLIC_COLUMNS}
         FROM app_admin.site_pages sp
         JOIN app_core.organizations o ON o.organization_id = sp.organization_id
         WHERE sp.slug = $1
         ORDER BY o.created_at
         LIMIT 1`,
        [slug],
      );
      return rows[0] ?? null;
    });
    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}

/** Página pública por page_key (para las páginas de sistema codificadas). */
export async function getPublicPageByKey(pageKey: string): Promise<PublicSitePage | null> {
  try {
    const row = await withClient(async (client) => {
      const { rows } = await client.query<PublicPageRow>(
        `SELECT ${PUBLIC_COLUMNS}
         FROM app_admin.site_pages sp
         JOIN app_core.organizations o ON o.organization_id = sp.organization_id
         WHERE sp.page_key = $1
         ORDER BY o.created_at
         LIMIT 1`,
        [pageKey],
      );
      return rows[0] ?? null;
    });
    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}
