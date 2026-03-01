import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { ModuleCode } from '@/lib/permissions';

export type ContentScope = 'aprendizaje' | 'metodologia' | 'formacion_mentores' | 'formacion_lideres';
export type ContentType = 'video' | 'pdf' | 'scorm' | 'article' | 'podcast' | 'html' | 'ppt';
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';

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
  created_at: string;
  updated_at: string;
}

const SCOPE_TO_MODULE: Record<ContentScope, ModuleCode> = {
  aprendizaje: 'aprendizaje',
  metodologia: 'metodologia',
  formacion_mentores: 'formacion_mentores',
  formacion_lideres: 'contenido',
};

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
      SELECT
        content_id::text,
        scope,
        title,
        description,
        content_type,
        category,
        duration_minutes,
        duration_label,
        url,
        author_user_id::text,
        author_name,
        status,
        is_recommended,
        created_by::text,
        approved_by::text,
        approved_at::text,
        published_at::text,
        created_at::text,
        updated_at::text
      FROM app_learning.content_items
      WHERE ($1::text IS NULL OR scope = $1)
      ORDER BY created_at DESC
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

  const status = input.status ?? 'draft';
  if (status === 'published') {
    await requireModulePermission(client, moduleCode, 'approve');
  }

  const { rows } = await client.query<ContentRow>(
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
        $13,
        CASE WHEN $11 = 'published' THEN $13 ELSE NULL END,
        CASE WHEN $11 = 'published' THEN now() ELSE NULL END,
        CASE WHEN $11 = 'published' THEN now() ELSE NULL END
      )
      RETURNING
        content_id::text,
        scope,
        title,
        description,
        content_type,
        category,
        duration_minutes,
        duration_label,
        url,
        author_user_id::text,
        author_name,
        status,
        is_recommended,
        created_by::text,
        approved_by::text,
        approved_at::text,
        published_at::text,
        created_at::text,
        updated_at::text
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
      actor.userId,
    ],
  );

  return mapRow(rows[0]);
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

  if (input.status === 'published') {
    await requireModulePermission(client, moduleCode, 'approve');
  }

  const { rows } = await client.query<ContentRow>(
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
        approved_by = CASE WHEN $9 = 'published' THEN $11 ELSE approved_by END,
        approved_at = CASE WHEN $9 = 'published' THEN now() ELSE approved_at END,
        published_at = CASE WHEN $9 = 'published' THEN COALESCE(published_at, now()) ELSE published_at END,
        updated_at = now()
      WHERE content_id = $1
      RETURNING
        content_id::text,
        scope,
        title,
        description,
        content_type,
        category,
        duration_minutes,
        duration_label,
        url,
        author_user_id::text,
        author_name,
        status,
        is_recommended,
        created_by::text,
        approved_by::text,
        approved_at::text,
        published_at::text,
        created_at::text,
        updated_at::text
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
      actor.userId,
    ],
  );

  const updated = rows[0];
  if (!updated) {
    throw new Error('Content item not found');
  }

  return mapRow(updated);
}

export async function deleteContent(client: PoolClient, contentId: string): Promise<{ contentId: string }> {
  const scope = await getScopeByContentId(client, contentId);
  const moduleCode = SCOPE_TO_MODULE[scope];

  await requireModulePermission(client, moduleCode, 'delete');

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
