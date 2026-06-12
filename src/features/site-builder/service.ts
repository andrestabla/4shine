import type { PoolClient } from 'pg';
import { isKnownBlockType } from './registry';
import type {
  CreateSitePageInput,
  SiteBlock,
  SitePage,
  SitePageSeo,
  SitePageSummary,
  UpdateSitePageInput,
} from './types';

export class SiteBuilderError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'SiteBuilderError';
    this.statusCode = statusCode;
  }
}

/** Rutas que ya existen en la app y no pueden usarse como slug de página nueva */
const RESERVED_SLUGS = new Set([
  'acceso',
  'verificar',
  'restablecer',
  'dashboard',
  'api',
  'branding',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;

/** Slug canónico de cada página de sistema (la ruta codificada original). */
export const SYSTEM_CANONICAL_SLUGS: Record<string, string> = {
  home: '',
  descubrimiento: 'descubrimiento',
  metodologia: 'metodologia',
  planes_precios: 'planes-precios',
  afiliados: 'advisers',
};

interface SitePageRow {
  page_id: string;
  page_key: string;
  title: string;
  slug: string;
  nav_label: string;
  show_in_nav: boolean;
  nav_order: number;
  is_visible: boolean;
  is_system: boolean;
  use_builder: boolean;
  sections: unknown;
  seo: unknown;
  created_at: string;
  updated_at: string;
}

function sanitizeBlocks(value: unknown, depth: number): SiteBlock[] {
  if (!Array.isArray(value)) return [];
  const sections: SiteBlock[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as Record<string, unknown>;
    if (!isKnownBlockType(raw.type)) continue;
    // Las secciones contenedoras solo se permiten en el nivel superior (Sección > Columna > Widget).
    if (raw.type === 'section' && depth > 0) continue;
    const blockId =
      typeof raw.blockId === 'string' && raw.blockId.length > 0 && raw.blockId.length <= 64
        ? raw.blockId
        : `blk_${Math.random().toString(36).slice(2, 10)}`;
    const props = raw.props && typeof raw.props === 'object' && !Array.isArray(raw.props)
      ? ({ ...(raw.props as Record<string, unknown>) } as Record<string, unknown>)
      : {};
    if (raw.type === 'section') {
      const rawColumns = Array.isArray(props.columns) ? props.columns : [];
      props.columns = rawColumns
        .filter((col): col is Record<string, unknown> => !!col && typeof col === 'object')
        .map((col) => ({
          columnId:
            typeof col.columnId === 'string' && col.columnId.length > 0 && col.columnId.length <= 64
              ? col.columnId
              : `col_${Math.random().toString(36).slice(2, 10)}`,
          blocks: sanitizeBlocks(col.blocks, depth + 1),
        }));
    }
    sections.push({ blockId, type: raw.type, isVisible: raw.isVisible !== false, props });
  }
  return sections;
}

export function sanitizeSections(value: unknown): SiteBlock[] {
  return sanitizeBlocks(value, 0);
}

function sanitizeSeo(value: unknown): SitePageSeo {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const seo: SitePageSeo = {};
  if (typeof raw.metaTitle === 'string') seo.metaTitle = raw.metaTitle.slice(0, 180);
  if (typeof raw.metaDescription === 'string') seo.metaDescription = raw.metaDescription.slice(0, 320);
  return seo;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function assertValidSlug(slug: string) {
  if (!SLUG_PATTERN.test(slug)) {
    throw new SiteBuilderError('El slug debe usar solo minúsculas, números y guiones.');
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw new SiteBuilderError(`El slug "${slug}" está reservado por la plataforma.`);
  }
}

function mapRow(row: SitePageRow): SitePage {
  return {
    pageId: row.page_id,
    pageKey: row.page_key,
    title: row.title,
    slug: row.slug,
    navLabel: row.nav_label,
    showInNav: row.show_in_nav,
    navOrder: row.nav_order,
    isVisible: row.is_visible,
    isSystem: row.is_system,
    useBuilder: row.use_builder,
    sections: sanitizeSections(row.sections),
    seo: sanitizeSeo(row.seo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function resolveOrganizationId(client: PoolClient, userId?: string): Promise<string> {
  if (userId) {
    const { rows } = await client.query<{ organization_id: string }>(
      `SELECT u.organization_id::text FROM app_core.users u WHERE u.user_id = $1 LIMIT 1`,
      [userId],
    );
    if (rows[0]?.organization_id) return rows[0].organization_id;
  }
  const { rows } = await client.query<{ organization_id: string }>(
    `SELECT o.organization_id::text FROM app_core.organizations o ORDER BY o.created_at LIMIT 1`,
  );
  if (!rows[0]?.organization_id) throw new SiteBuilderError('No organization found', 500);
  return rows[0].organization_id;
}

const SELECT_COLUMNS = `
  page_id::text, page_key, title, slug, nav_label, show_in_nav, nav_order,
  is_visible, is_system, use_builder, sections, seo,
  created_at::text, updated_at::text
`;

export async function listSitePages(client: PoolClient, organizationId: string): Promise<SitePageSummary[]> {
  const { rows } = await client.query<SitePageRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM app_admin.site_pages
     WHERE organization_id = $1::uuid
     ORDER BY nav_order, created_at`,
    [organizationId],
  );
  return rows.map((row) => {
    const page = mapRow(row);
    return {
      pageId: page.pageId,
      pageKey: page.pageKey,
      title: page.title,
      slug: page.slug,
      navLabel: page.navLabel,
      showInNav: page.showInNav,
      navOrder: page.navOrder,
      isVisible: page.isVisible,
      isSystem: page.isSystem,
      useBuilder: page.useBuilder,
      sectionsCount: page.sections.length,
      updatedAt: page.updatedAt,
    };
  });
}

export async function getSitePageById(
  client: PoolClient,
  organizationId: string,
  pageId: string,
): Promise<SitePage | null> {
  const { rows } = await client.query<SitePageRow>(
    `SELECT ${SELECT_COLUMNS}
     FROM app_admin.site_pages
     WHERE organization_id = $1::uuid AND page_id = $2::uuid
     LIMIT 1`,
    [organizationId, pageId],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createSitePage(
  client: PoolClient,
  organizationId: string,
  userId: string,
  input: CreateSitePageInput,
): Promise<SitePage> {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) throw new SiteBuilderError('El título es requerido.');

  const slug = normalizeSlug(typeof input.slug === 'string' && input.slug ? input.slug : title);
  if (!slug) throw new SiteBuilderError('No se pudo derivar un slug válido del título.');
  assertValidSlug(slug);

  const navLabel = typeof input.navLabel === 'string' ? input.navLabel.trim().slice(0, 80) : '';
  const pageKey = `custom_${slug.replace(/-/g, '_')}`.slice(0, 64);

  try {
    const { rows } = await client.query<SitePageRow>(
      `INSERT INTO app_admin.site_pages
         (organization_id, page_key, title, slug, nav_label, show_in_nav, nav_order, is_visible, is_system, use_builder, sections, created_by, updated_by)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, COALESCE((SELECT MAX(nav_order) + 1 FROM app_admin.site_pages WHERE organization_id = $1::uuid), 100), $7, false, true, '[]'::jsonb, $8::uuid, $8::uuid)
       RETURNING ${SELECT_COLUMNS}`,
      [
        organizationId,
        pageKey,
        title.slice(0, 160),
        slug,
        navLabel,
        input.showInNav !== false,
        input.isVisible !== false,
        userId,
      ],
    );
    return mapRow(rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      throw new SiteBuilderError(`Ya existe una página con el slug "${slug}".`, 409);
    }
    throw error;
  }
}

export async function updateSitePage(
  client: PoolClient,
  organizationId: string,
  userId: string,
  pageId: string,
  input: UpdateSitePageInput,
): Promise<SitePage> {
  const existing = await getSitePageById(client, organizationId, pageId);
  if (!existing) throw new SiteBuilderError('Página no encontrada.', 404);

  const useBuilder = typeof input.useBuilder === 'boolean' ? input.useBuilder : existing.useBuilder;
  const canonicalSlug = SYSTEM_CANONICAL_SLUGS[existing.pageKey];

  let slug = existing.slug;
  // La home siempre vive en '/'; las demás páginas de sistema solo pueden cambiar
  // de URL cuando el builder está activo (la ruta original redirige a la nueva).
  const slugLocked = existing.isSystem && (existing.pageKey === 'home' || !useBuilder);
  if (typeof input.slug === 'string' && !slugLocked) {
    slug = normalizeSlug(input.slug);
    if (!slug) throw new SiteBuilderError('Slug inválido.');
    if (slug !== canonicalSlug) assertValidSlug(slug);
  }
  if (existing.isSystem && !useBuilder && canonicalSlug !== undefined) {
    slug = canonicalSlug;
  }

  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim().slice(0, 160) : existing.title;
  const navLabel = typeof input.navLabel === 'string' ? input.navLabel.trim().slice(0, 80) : existing.navLabel;
  const showInNav = typeof input.showInNav === 'boolean' ? input.showInNav : existing.showInNav;
  const navOrder = typeof input.navOrder === 'number' && Number.isFinite(input.navOrder) ? Math.round(input.navOrder) : existing.navOrder;
  const isVisible = typeof input.isVisible === 'boolean' ? input.isVisible : existing.isVisible;
  const sections = input.sections !== undefined ? sanitizeSections(input.sections) : existing.sections;
  const seo = input.seo !== undefined ? sanitizeSeo(input.seo) : existing.seo;

  try {
    const { rows } = await client.query<SitePageRow>(
      `UPDATE app_admin.site_pages
       SET title = $3, slug = $4, nav_label = $5, show_in_nav = $6, nav_order = $7,
           is_visible = $8, use_builder = $9, sections = $10::jsonb, seo = $11::jsonb,
           updated_by = $12::uuid, updated_at = now()
       WHERE organization_id = $1::uuid AND page_id = $2::uuid
       RETURNING ${SELECT_COLUMNS}`,
      [
        organizationId,
        pageId,
        title,
        slug,
        navLabel,
        showInNav,
        navOrder,
        isVisible,
        useBuilder,
        JSON.stringify(sections),
        JSON.stringify(seo),
        userId,
      ],
    );
    if (!rows[0]) throw new SiteBuilderError('Página no encontrada.', 404);
    return mapRow(rows[0]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      throw new SiteBuilderError(`Ya existe una página con el slug "${slug}".`, 409);
    }
    throw error;
  }
}

export async function deleteSitePage(
  client: PoolClient,
  organizationId: string,
  pageId: string,
): Promise<void> {
  const existing = await getSitePageById(client, organizationId, pageId);
  if (!existing) throw new SiteBuilderError('Página no encontrada.', 404);
  if (existing.isSystem) {
    throw new SiteBuilderError('Las páginas del sistema no se pueden eliminar. Puedes ocultarlas.', 400);
  }
  await client.query(
    `DELETE FROM app_admin.site_pages WHERE organization_id = $1::uuid AND page_id = $2::uuid`,
    [organizationId, pageId],
  );
}
