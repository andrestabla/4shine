import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type { ModuleCode } from '@/lib/permissions';

export type ContentScope = 'aprendizaje' | 'metodologia' | 'formacion_mentores' | 'formacion_lideres';
export type ContentType = 'video' | 'pdf' | 'scorm' | 'article' | 'podcast' | 'html' | 'ppt';
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
export type ContentCompetencyMetadata = Record<string, string | null>;

export interface ContentItemRecord {
  contentId: string;
  scope: ContentScope;
  title: string;
  description: string | null;
  contentType: ContentType;
  category: string;
  durationMinutes: number | null;
  durationLabel: string | null;
  url: string | null;
  authorUserId: string | null;
  authorName: string | null;
  status: ContentStatus;
  isRecommended: boolean;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  competencyMetadata: ContentCompetencyMetadata;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentInput {
  scope: ContentScope;
  title: string;
  description?: string | null;
  contentType: ContentType;
  category: string;
  durationMinutes?: number | null;
  durationLabel?: string | null;
  url?: string | null;
  status?: ContentStatus;
  isRecommended?: boolean;
  competencyMetadata?: ContentCompetencyMetadata;
  tags?: string[];
}

export interface UpdateContentInput {
  title?: string;
  description?: string | null;
  contentType?: ContentType;
  category?: string;
  durationMinutes?: number | null;
  durationLabel?: string | null;
  url?: string | null;
  status?: ContentStatus;
  isRecommended?: boolean;
  competencyMetadata?: ContentCompetencyMetadata;
  tags?: string[];
}

interface ContentRow {
  content_id: string;
  scope: ContentScope;
  title: string;
  description: string | null;
  content_type: ContentType;
  category: string;
  duration_minutes: number | null;
  duration_label: string | null;
  url: string | null;
  author_user_id: string | null;
  author_name: string | null;
  status: ContentStatus;
  is_recommended: boolean;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  competency_metadata: ContentCompetencyMetadata | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const SCOPE_TO_MODULE: Record<ContentScope, ModuleCode> = {
  aprendizaje: 'aprendizaje',
  metodologia: 'metodologia',
  formacion_mentores: 'formacion_mentores',
  formacion_lideres: 'contenido',
};

const CONTENT_SELECT = `
  SELECT
    ci.content_id::text AS content_id,
    ci.scope,
    ci.title,
    ci.description,
    ci.content_type,
    ci.category,
    ci.duration_minutes,
    ci.duration_label,
    ci.url,
    ci.author_user_id::text,
    ci.author_name,
    ci.status,
    ci.is_recommended,
    ci.created_by::text,
    ci.approved_by::text,
    ci.approved_at::text,
    ci.published_at::text,
    ci.competency_metadata,
    COALESCE(tags.tags, ARRAY[]::text[]) AS tags,
    ci.created_at::text,
    ci.updated_at::text
  FROM app_learning.content_items ci
  LEFT JOIN (
    SELECT ct.content_id, ARRAY_AGG(t.tag_name ORDER BY t.tag_name) AS tags
    FROM app_learning.content_tags ct
    JOIN app_learning.tags t ON t.tag_id = ct.tag_id
    GROUP BY ct.content_id
  ) tags ON tags.content_id = ci.content_id
`;

function mapRow(row: ContentRow): ContentItemRecord {
  return {
    contentId: row.content_id,
    scope: row.scope,
    title: row.title,
    description: row.description,
    contentType: row.content_type,
    category: row.category,
    durationMinutes: row.duration_minutes,
    durationLabel: row.duration_label,
    url: row.url,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    status: row.status,
    isRecommended: row.is_recommended,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    publishedAt: row.published_at,
    competencyMetadata: row.competency_metadata ?? {},
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];

  const seen = new Set<string>();

  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      const normalized = tag.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function normalizeCompetencyMetadata(metadata: ContentCompetencyMetadata | undefined): ContentCompetencyMetadata {
  if (!metadata) return {};

  return Object.entries(metadata).reduce<ContentCompetencyMetadata>((acc, [key, value]) => {
    const normalizedKey = key.trim();
    if (!normalizedKey) {
      return acc;
    }

    acc[normalizedKey] = typeof value === 'string' ? value.trim() || null : null;
    return acc;
  }, {});
}

async function syncContentTags(client: PoolClient, contentId: string, tags: string[]) {
  await client.query(
    `
      DELETE FROM app_learning.content_tags
      WHERE content_id = $1
    `,
    [contentId],
  );

  if (tags.length === 0) {
    return;
  }

  await client.query(
    `
      INSERT INTO app_learning.tags (tag_name)
      SELECT DISTINCT UNNEST($1::text[])
      ON CONFLICT (tag_name) DO NOTHING
    `,
    [tags],
  );

  await client.query(
    `
      INSERT INTO app_learning.content_tags (content_id, tag_id)
      SELECT $1, t.tag_id
      FROM app_learning.tags t
      WHERE t.tag_name = ANY($2::text[])
      ON CONFLICT DO NOTHING
    `,
    [contentId, tags],
  );
}

async function getContentById(client: PoolClient, contentId: string): Promise<ContentItemRecord> {
  const { rows } = await client.query<ContentRow>(
    `
      ${CONTENT_SELECT}
      WHERE ci.content_id = $1
      LIMIT 1
    `,
    [contentId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Content item not found');
  }

  return mapRow(row);
}

async function getScopeByContentId(client: PoolClient, contentId: string): Promise<ContentScope> {
  const { rows } = await client.query<{ scope: ContentScope }>(
    `
      SELECT scope
      FROM app_learning.content_items
      WHERE content_id = $1
      LIMIT 1
    `,
    [contentId],
  );

  const scope = rows[0]?.scope;
  if (!scope) {
    throw new Error('Content item not found');
  }

  return scope;
}

export async function listContent(
  client: PoolClient,
  options?: { scope?: ContentScope; limit?: number },
): Promise<ContentItemRecord[]> {
  const scope = options?.scope ?? null;
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);

  const { rows } = await client.query<ContentRow>(
    `
      ${CONTENT_SELECT}
      WHERE ($1::text IS NULL OR ci.scope = $1)
      ORDER BY ci.created_at DESC
      LIMIT $2
    `,
    [scope, limit],
  );

  return rows.map(mapRow);
}

export async function createContent(
  client: PoolClient,
  actor: AuthUser,
  input: CreateContentInput,
): Promise<ContentItemRecord> {
  const moduleCode = SCOPE_TO_MODULE[input.scope];
  await requireModulePermission(client, moduleCode, 'create');

  if (input.scope === 'aprendizaje' && !['gestor', 'admin'].includes(actor.role)) {
    throw new ForbiddenError('Only gestores and admins can create learning resources');
  }

  const status = input.status ?? 'draft';
  const competencyMetadata = normalizeCompetencyMetadata(input.competencyMetadata);
  const tags = normalizeTags(input.tags);
  if (status === 'published') {
    await requireModulePermission(client, moduleCode, 'approve');
  }

  const { rows } = await client.query<{ content_id: string }>(
    `
      INSERT INTO app_learning.content_items (
        scope,
        title,
        description,
        content_type,
        category,
        duration_minutes,
        duration_label,
        url,
        author_user_id,
        author_name,
        status,
        is_recommended,
        competency_metadata,
        created_by,
        approved_by,
        approved_at,
        published_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13::jsonb,
        $14,
        CASE WHEN $11 = 'published' THEN $14 ELSE NULL END,
        CASE WHEN $11 = 'published' THEN now() ELSE NULL END,
        CASE WHEN $11 = 'published' THEN now() ELSE NULL END
      )
      RETURNING content_id::text
    `,
    [
      input.scope,
      input.title,
      input.description ?? null,
      input.contentType,
      input.category,
      input.durationMinutes ?? null,
      input.durationLabel ?? null,
      input.url ?? null,
      actor.userId,
      actor.name,
      status,
      input.isRecommended ?? false,
      JSON.stringify(competencyMetadata),
      actor.userId,
    ],
  );

  const contentId = rows[0]?.content_id;
  if (!contentId) {
    throw new Error('Failed to create content item');
  }

  await syncContentTags(client, contentId, tags);

  return getContentById(client, contentId);
}

export async function updateContent(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
  input: UpdateContentInput,
): Promise<ContentItemRecord> {
  const scope = await getScopeByContentId(client, contentId);
  const moduleCode = SCOPE_TO_MODULE[scope];

  await requireModulePermission(client, moduleCode, 'update');

  if (scope === 'aprendizaje' && !['gestor', 'admin'].includes(actor.role)) {
    throw new ForbiddenError('Only gestores and admins can update learning resources');
  }

  if (input.status === 'published') {
    await requireModulePermission(client, moduleCode, 'approve');
  }

  const competencyMetadata =
    input.competencyMetadata === undefined ? undefined : normalizeCompetencyMetadata(input.competencyMetadata);

  const { rows } = await client.query<{ content_id: string }>(
    `
      UPDATE app_learning.content_items
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        content_type = COALESCE($4, content_type),
        category = COALESCE($5, category),
        duration_minutes = COALESCE($6, duration_minutes),
        duration_label = COALESCE($7, duration_label),
        url = COALESCE($8, url),
        status = COALESCE($9, status),
        is_recommended = COALESCE($10, is_recommended),
        competency_metadata = COALESCE($11::jsonb, competency_metadata),
        approved_by = CASE WHEN $9 = 'published' THEN $12 ELSE approved_by END,
        approved_at = CASE WHEN $9 = 'published' THEN now() ELSE approved_at END,
        published_at = CASE WHEN $9 = 'published' THEN COALESCE(published_at, now()) ELSE published_at END,
        updated_at = now()
      WHERE content_id = $1
      RETURNING content_id::text
    `,
    [
      contentId,
      input.title ?? null,
      input.description ?? null,
      input.contentType ?? null,
      input.category ?? null,
      input.durationMinutes ?? null,
      input.durationLabel ?? null,
      input.url ?? null,
      input.status ?? null,
      input.isRecommended ?? null,
      competencyMetadata ? JSON.stringify(competencyMetadata) : null,
      actor.userId,
    ],
  );

  const updatedContentId = rows[0]?.content_id;
  if (!updatedContentId) {
    throw new Error('Content item not found');
  }

  if (input.tags !== undefined) {
    await syncContentTags(client, updatedContentId, normalizeTags(input.tags));
  }

  return getContentById(client, updatedContentId);
}

export async function deleteContent(client: PoolClient, contentId: string): Promise<{ contentId: string }> {
  const scope = await getScopeByContentId(client, contentId);
  const moduleCode = SCOPE_TO_MODULE[scope];

  await requireModulePermission(client, moduleCode, 'delete');

  const { rows: actorRows } = await client.query<{ current_role: string }>(
    `SELECT current_setting('app.current_role', true) AS current_role`,
  );

  if (scope === 'aprendizaje' && !['gestor', 'admin'].includes(actorRows[0]?.current_role ?? '')) {
    throw new ForbiddenError('Only gestores and admins can delete learning resources');
  }

  const { rows } = await client.query<{ content_id: string }>(
    `
      DELETE FROM app_learning.content_items
      WHERE content_id = $1
      RETURNING content_id::text
    `,
    [contentId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('Content item not found');
  }

  return {
    contentId: deleted.content_id,
  };
}
