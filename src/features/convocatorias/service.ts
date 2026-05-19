import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireCommunityAccess } from '@/features/access/service';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { dispatchNotification } from '@/features/notificaciones/engine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConvocatoriaStatus = 'draft' | 'open' | 'closed' | 'suspended';

export interface ConvocatoriaDate {
  dateId: string;
  label: string;
  dateValue: string;
  sortOrder: number;
}

export interface ConvocatoriaFaq {
  faqId: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface ConvocatoriaImage {
  imageId: string;
  url: string;
  sortOrder: number;
}

export interface ConvocatoriaAttachment {
  attachmentId: string;
  fileUrl: string;
  fileName: string;
}

export interface ConvocatoriaSummary {
  convocatoriaId: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  externalUrl: string | null;
  location: string | null;
  status: ConvocatoriaStatus;
  applicationsCount: number;
  hasApplied: boolean;
  nextDate: string | null;
  nextDateLabel: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConvocatoriaDetail extends ConvocatoriaSummary {
  images: ConvocatoriaImage[];
  attachments: ConvocatoriaAttachment[];
  dates: ConvocatoriaDate[];
  faqs: ConvocatoriaFaq[];
}

export interface ConvocatoriaForumPost {
  postId: string;
  convocatoriaId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
}

export interface CreateConvocatoriaInput {
  title: string;
  description?: string;
  coverImageUrl?: string | null;
  externalUrl?: string | null;
  location?: string | null;
  status?: ConvocatoriaStatus;
}

export interface UpdateConvocatoriaInput {
  title?: string;
  description?: string;
  coverImageUrl?: string | null;
  externalUrl?: string | null;
  location?: string | null;
  status?: ConvocatoriaStatus;
}

export interface SetDatesInput {
  label: string;
  dateValue: string;
  sortOrder?: number;
}

export interface SetFaqsInput {
  question: string;
  answer: string;
  sortOrder?: number;
}

// ── Row types ─────────────────────────────────────────────────────────────────

interface ConvocatoriaSummaryRow {
  convocatoria_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  external_url: string | null;
  location: string | null;
  status: ConvocatoriaStatus;
  applications_count: number;
  has_applied: boolean;
  next_date: string | null;
  next_date_label: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ConvocatoriaImageRow {
  image_id: string;
  url: string;
  sort_order: number;
}

interface ConvocatoriaAttachmentRow {
  attachment_id: string;
  file_url: string;
  file_name: string;
}

interface ConvocatoriaDateRow {
  date_id: string;
  label: string;
  date_value: string;
  sort_order: number;
}

interface ConvocatoriaFaqRow {
  faq_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface ForumPostRow {
  post_id: string;
  convocatoria_id: string;
  author_user_id: string;
  author_name: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapSummary(row: ConvocatoriaSummaryRow): ConvocatoriaSummary {
  return {
    convocatoriaId: row.convocatoria_id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    externalUrl: row.external_url,
    location: row.location,
    status: row.status,
    applicationsCount: Number(row.applications_count ?? 0),
    hasApplied: row.has_applied === true,
    nextDate: row.next_date,
    nextDateLabel: row.next_date_label,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapImage(row: ConvocatoriaImageRow): ConvocatoriaImage {
  return { imageId: row.image_id, url: row.url, sortOrder: row.sort_order };
}

function mapAttachment(row: ConvocatoriaAttachmentRow): ConvocatoriaAttachment {
  return { attachmentId: row.attachment_id, fileUrl: row.file_url, fileName: row.file_name };
}

function mapDate(row: ConvocatoriaDateRow): ConvocatoriaDate {
  return { dateId: row.date_id, label: row.label, dateValue: row.date_value, sortOrder: row.sort_order };
}

function mapFaq(row: ConvocatoriaFaqRow): ConvocatoriaFaq {
  return { faqId: row.faq_id, question: row.question, answer: row.answer, sortOrder: row.sort_order };
}

function mapForumPost(row: ForumPostRow): ConvocatoriaForumPost {
  return {
    postId: row.post_id,
    convocatoriaId: row.convocatoria_id,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    body: row.body,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
  };
}

// ── Summary select ────────────────────────────────────────────────────────────

function summarySelect(actorId: string) {
  return `
    SELECT
      c.convocatoria_id::text,
      c.title,
      c.description,
      COALESCE(
        c.cover_image_url,
        (SELECT ci.url FROM app_networking.convocatoria_images ci
         WHERE ci.convocatoria_id = c.convocatoria_id
         ORDER BY ci.sort_order ASC, ci.created_at ASC
         LIMIT 1)
      ) AS cover_image_url,
      c.external_url,
      c.location,
      c.status,
      COUNT(DISTINCT ca.application_id)::int AS applications_count,
      EXISTS(
        SELECT 1 FROM app_networking.convocatoria_applications ca2
        WHERE ca2.convocatoria_id = c.convocatoria_id
          AND ca2.applicant_user_id = '${actorId}'::uuid
      ) AS has_applied,
      (
        SELECT cd.date_value::text
        FROM app_networking.convocatoria_dates cd
        WHERE cd.convocatoria_id = c.convocatoria_id
          AND cd.date_value >= CURRENT_DATE
        ORDER BY cd.date_value ASC
        LIMIT 1
      ) AS next_date,
      (
        SELECT cd.label
        FROM app_networking.convocatoria_dates cd
        WHERE cd.convocatoria_id = c.convocatoria_id
          AND cd.date_value >= CURRENT_DATE
        ORDER BY cd.date_value ASC
        LIMIT 1
      ) AS next_date_label,
      c.created_by::text,
      c.created_at::text,
      c.updated_at::text
    FROM app_networking.convocatorias c
    LEFT JOIN app_networking.convocatoria_applications ca
      ON ca.convocatoria_id = c.convocatoria_id
  `;
}

// ── List ──────────────────────────────────────────────────────────────────────

async function canManageConvocatorias(client: PoolClient, role: string): Promise<boolean> {
  const { rows } = await client.query<{ can_create: boolean }>(
    `SELECT can_create FROM app_auth.role_module_permissions
     WHERE role_code = $1 AND module_code = 'convocatorias'`,
    [role],
  );
  return rows[0]?.can_create === true;
}

export async function listConvocatorias(
  client: PoolClient,
  actor: AuthUser,
  limit = 100,
): Promise<ConvocatoriaSummary[]> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const isManager = await canManageConvocatorias(client, actor.role);
  const draftFilter = isManager ? '' : `WHERE c.status != 'draft'`;

  const { rows } = await client.query<ConvocatoriaSummaryRow>(
    `${summarySelect(actor.userId)}
     ${draftFilter}
     GROUP BY c.convocatoria_id
     ORDER BY c.created_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 500)],
  );

  return rows.map(mapSummary);
}

// ── Get one ───────────────────────────────────────────────────────────────────

export async function getConvocatoria(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
): Promise<ConvocatoriaDetail> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const summaryResult = await client.query<ConvocatoriaSummaryRow>(
    `${summarySelect(actor.userId)}
     WHERE c.convocatoria_id = $1
     GROUP BY c.convocatoria_id`,
    [convocatoriaId],
  );

  const summaryRow = summaryResult.rows[0];
  if (!summaryRow) throw new Error('Convocatoria not found');

  if (summaryRow.status === 'draft') {
    const isManager = await canManageConvocatorias(client, actor.role);
    if (!isManager) throw new Error('Convocatoria not found');
  }

  const [imagesResult, attachmentsResult, datesResult, faqsResult] = await Promise.all([
    client.query<ConvocatoriaImageRow>(
      `SELECT image_id::text, url, sort_order
       FROM app_networking.convocatoria_images
       WHERE convocatoria_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [convocatoriaId],
    ),
    client.query<ConvocatoriaAttachmentRow>(
      `SELECT attachment_id::text, file_url, file_name
       FROM app_networking.convocatoria_attachments
       WHERE convocatoria_id = $1
       ORDER BY created_at ASC`,
      [convocatoriaId],
    ),
    client.query<ConvocatoriaDateRow>(
      `SELECT date_id::text, label, date_value::text, sort_order
       FROM app_networking.convocatoria_dates
       WHERE convocatoria_id = $1
       ORDER BY sort_order ASC, date_value ASC`,
      [convocatoriaId],
    ),
    client.query<ConvocatoriaFaqRow>(
      `SELECT faq_id::text, question, answer, sort_order
       FROM app_networking.convocatoria_faqs
       WHERE convocatoria_id = $1
       ORDER BY sort_order ASC`,
      [convocatoriaId],
    ),
  ]);

  return {
    ...mapSummary(summaryRow),
    images: imagesResult.rows.map(mapImage),
    attachments: attachmentsResult.rows.map(mapAttachment),
    dates: datesResult.rows.map(mapDate),
    faqs: faqsResult.rows.map(mapFaq),
  };
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createConvocatoria(
  client: PoolClient,
  actor: AuthUser,
  input: CreateConvocatoriaInput,
): Promise<ConvocatoriaSummary> {
  await requireModulePermission(client, 'convocatorias', 'create');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<{ convocatoria_id: string }>(
    `INSERT INTO app_networking.convocatorias
       (title, description, cover_image_url, external_url, location, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING convocatoria_id::text`,
    [
      input.title,
      input.description ?? '',
      input.coverImageUrl ?? null,
      input.externalUrl ?? null,
      input.location ?? null,
      input.status ?? 'draft',
      actor.userId,
    ],
  );

  const id = rows[0]?.convocatoria_id;
  if (!id) throw new Error('Failed to create convocatoria');

  const detail = await getConvocatoria(client, actor, id);
  return detail;
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateConvocatoria(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  input: UpdateConvocatoriaInput,
): Promise<ConvocatoriaSummary> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rowCount } = await client.query(
    `UPDATE app_networking.convocatorias
     SET
       title           = COALESCE($2, title),
       description     = COALESCE($3, description),
       cover_image_url = CASE WHEN $4::text IS NOT NULL THEN $4 ELSE cover_image_url END,
       external_url    = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE external_url END,
       location        = CASE WHEN $6::text IS NOT NULL THEN $6 ELSE location END,
       status          = COALESCE($7, status)
     WHERE convocatoria_id = $1`,
    [
      convocatoriaId,
      input.title ?? null,
      input.description ?? null,
      input.coverImageUrl !== undefined ? (input.coverImageUrl ?? '') : null,
      input.externalUrl !== undefined ? (input.externalUrl ?? '') : null,
      input.location !== undefined ? (input.location ?? '') : null,
      input.status ?? null,
    ],
  );

  if (!rowCount) throw new Error('Convocatoria not found');

  const detail = await getConvocatoria(client, actor, convocatoriaId);
  return detail;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteConvocatoria(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
): Promise<{ convocatoriaId: string }> {
  await requireModulePermission(client, 'convocatorias', 'delete');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<{ convocatoria_id: string }>(
    `DELETE FROM app_networking.convocatorias
     WHERE convocatoria_id = $1
     RETURNING convocatoria_id::text`,
    [convocatoriaId],
  );

  if (!rows[0]) throw new Error('Convocatoria not found');
  return { convocatoriaId: rows[0].convocatoria_id };
}

// ── Images ────────────────────────────────────────────────────────────────────

export async function addImage(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  url: string,
): Promise<ConvocatoriaImage> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<ConvocatoriaImageRow>(
    `INSERT INTO app_networking.convocatoria_images (convocatoria_id, url, sort_order)
     SELECT $1, $2,
       COALESCE((SELECT MAX(sort_order) + 1 FROM app_networking.convocatoria_images WHERE convocatoria_id = $1), 0)
     RETURNING image_id::text, url, sort_order`,
    [convocatoriaId, url],
  );

  if (!rows[0]) throw new Error('Failed to add image');
  return mapImage(rows[0]);
}

export async function removeImage(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  imageId: string,
): Promise<{ imageId: string }> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<{ image_id: string }>(
    `DELETE FROM app_networking.convocatoria_images
     WHERE image_id = $1 AND convocatoria_id = $2
     RETURNING image_id::text`,
    [imageId, convocatoriaId],
  );

  if (!rows[0]) throw new Error('Image not found');
  return { imageId: rows[0].image_id };
}

// ── Attachments ───────────────────────────────────────────────────────────────

export async function addAttachment(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  fileUrl: string,
  fileName: string,
): Promise<ConvocatoriaAttachment> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<ConvocatoriaAttachmentRow>(
    `INSERT INTO app_networking.convocatoria_attachments (convocatoria_id, file_url, file_name)
     VALUES ($1, $2, $3)
     RETURNING attachment_id::text, file_url, file_name`,
    [convocatoriaId, fileUrl, fileName],
  );

  if (!rows[0]) throw new Error('Failed to add attachment');
  return mapAttachment(rows[0]);
}

export async function removeAttachment(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  attachmentId: string,
): Promise<{ attachmentId: string }> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<{ attachment_id: string }>(
    `DELETE FROM app_networking.convocatoria_attachments
     WHERE attachment_id = $1 AND convocatoria_id = $2
     RETURNING attachment_id::text`,
    [attachmentId, convocatoriaId],
  );

  if (!rows[0]) throw new Error('Attachment not found');
  return { attachmentId: rows[0].attachment_id };
}

// ── Dates ─────────────────────────────────────────────────────────────────────

export async function setDates(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  dates: SetDatesInput[],
): Promise<ConvocatoriaDate[]> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  await client.query(
    `DELETE FROM app_networking.convocatoria_dates WHERE convocatoria_id = $1`,
    [convocatoriaId],
  );

  if (dates.length === 0) return [];

  const values = dates.map((d, i) => {
    const base = i * 4;
    return `($${base + 1}, $${base + 2}, $${base + 3}::date, $${base + 4})`;
  });

  const params: unknown[] = dates.flatMap((d, i) => [
    convocatoriaId,
    d.label,
    d.dateValue,
    d.sortOrder ?? i,
  ]);

  const { rows } = await client.query<ConvocatoriaDateRow>(
    `INSERT INTO app_networking.convocatoria_dates (convocatoria_id, label, date_value, sort_order)
     VALUES ${values.join(', ')}
     RETURNING date_id::text, label, date_value::text, sort_order
     ORDER BY sort_order ASC`,
    params,
  );

  return rows.map(mapDate);
}

// ── FAQs ──────────────────────────────────────────────────────────────────────

export async function setFaqs(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  faqs: SetFaqsInput[],
): Promise<ConvocatoriaFaq[]> {
  await requireModulePermission(client, 'convocatorias', 'update');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  await client.query(
    `DELETE FROM app_networking.convocatoria_faqs WHERE convocatoria_id = $1`,
    [convocatoriaId],
  );

  if (faqs.length === 0) return [];

  const values = faqs.map((_, i) => {
    const base = i * 4;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
  });

  const params: unknown[] = faqs.flatMap((f, i) => [
    convocatoriaId,
    f.question,
    f.answer,
    f.sortOrder ?? i,
  ]);

  const { rows } = await client.query<ConvocatoriaFaqRow>(
    `INSERT INTO app_networking.convocatoria_faqs (convocatoria_id, question, answer, sort_order)
     VALUES ${values.join(', ')}
     RETURNING faq_id::text, question, answer, sort_order
     ORDER BY sort_order ASC`,
    params,
  );

  return rows.map(mapFaq);
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function applyToConvocatoria(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
): Promise<{ applicationId: string }> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const open = await client.query<{ status: string; title: string }>(
    `SELECT status, title FROM app_networking.convocatorias WHERE convocatoria_id = $1`,
    [convocatoriaId],
  );

  if (!open.rows[0]) throw new Error('Convocatoria not found');
  if (open.rows[0].status !== 'open') throw new Error('Esta convocatoria no está abierta');

  const { rows } = await client.query<{ application_id: string }>(
    `INSERT INTO app_networking.convocatoria_applications (convocatoria_id, applicant_user_id)
     VALUES ($1, $2)
     ON CONFLICT (convocatoria_id, applicant_user_id) DO NOTHING
     RETURNING application_id::text`,
    [convocatoriaId, actor.userId],
  );

  const id = rows[0]?.application_id;
  if (!id) throw new Error('Ya aplicaste a esta convocatoria');

  // Dispatch notification (fire-and-forget)
  const { rows: orgRows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [actor.userId],
  );
  const organizationId = orgRows[0]?.organization_id;
  if (organizationId) {
    void dispatchNotification(client, {
      organizationId,
      recipientUserId: actor.userId,
      recipientEmail: actor.email,
      eventKey: 'convocatorias.applied',
      variables: {
        nombre: actor.name.split(' ')[0] ?? actor.name,
        titulo: open.rows[0].title ?? '',
        fecha_cierre: '',
        enlace_plataforma: 'https://app.4shine.co',
        plataforma: '4Shine',
      },
    });
  }

  return { applicationId: id };
}

export async function withdrawApplication(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
): Promise<{ convocatoriaId: string }> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  await client.query(
    `DELETE FROM app_networking.convocatoria_applications
     WHERE convocatoria_id = $1 AND applicant_user_id = $2`,
    [convocatoriaId, actor.userId],
  );

  return { convocatoriaId };
}

// ── Forum ─────────────────────────────────────────────────────────────────────

export async function listForumPosts(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  limit = 50,
): Promise<ConvocatoriaForumPost[]> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rows } = await client.query<ForumPostRow>(
    `SELECT
       fp.post_id::text,
       fp.convocatoria_id::text,
       fp.author_user_id::text,
       COALESCE(u.first_name || ' ' || u.last_name, u.email, 'Miembro') AS author_name,
       fp.body,
       fp.is_pinned,
       fp.created_at::text
     FROM app_networking.convocatoria_forum_posts fp
     JOIN app_core.users u ON u.user_id = fp.author_user_id
     WHERE fp.convocatoria_id = $1
     ORDER BY fp.is_pinned DESC, fp.created_at ASC
     LIMIT $2`,
    [convocatoriaId, Math.min(Math.max(limit, 1), 200)],
  );

  return rows.map(mapForumPost);
}

export async function createForumPost(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  body: string,
  isPinned = false,
): Promise<ConvocatoriaForumPost> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const trimmed = body.trim();
  if (!trimmed) throw new Error('El mensaje no puede estar vacío');

  const { rows } = await client.query<{ post_id: string }>(
    `INSERT INTO app_networking.convocatoria_forum_posts (convocatoria_id, author_user_id, body, is_pinned)
     VALUES ($1, $2, $3, $4)
     RETURNING post_id::text`,
    [convocatoriaId, actor.userId, trimmed, isPinned],
  );

  const postId = rows[0]?.post_id;
  if (!postId) throw new Error('Failed to create forum post');

  const all = await listForumPosts(client, actor, convocatoriaId, 200);
  const post = all.find((p) => p.postId === postId);
  if (!post) throw new Error('Post not found after creation');
  return post;
}

export async function deleteForumPost(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
  postId: string,
): Promise<{ postId: string }> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const canModerate = await client.query<{ can_moderate: boolean }>(
    `SELECT can_moderate FROM app_core.module_permissions
     WHERE module_code = 'convocatorias' AND role_id = (
       SELECT role_id FROM app_core.roles WHERE role_name = $1
     )`,
    [actor.role],
  );

  const isModerator = canModerate.rows[0]?.can_moderate === true;

  const { rows } = await client.query<{ post_id: string }>(
    `DELETE FROM app_networking.convocatoria_forum_posts
     WHERE post_id = $1
       AND convocatoria_id = $2
       AND ($3 OR author_user_id = $4::uuid)
     RETURNING post_id::text`,
    [postId, convocatoriaId, isModerator, actor.userId],
  );

  if (!rows[0]) throw new Error('Post not found or no permission to delete');
  return { postId: rows[0].post_id };
}

// ── Convocatoria requests (lider → gestor/admin) ──────────────────────────────

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ConvocatoriaRequest {
  requestId: string;
  title: string;
  description: string;
  objetivo: string;
  tipo: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  requisitos: string;
  enlacesComplementarios: string;
  numeroContacto: string;
  requesterUserId: string;
  requesterName: string;
  status: RequestStatus;
  reviewerUserId: string | null;
  reviewerName: string | null;
  reviewerNotes: string | null;
  convocatoriaId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestInput {
  title: string;
  description?: string;
  objetivo?: string;
  tipo?: 'laboral' | 'proyecto_social' | 'proveedor' | 'convenio' | 'otra';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  requisitos?: string;
  enlacesComplementarios?: string;
  numeroContacto?: string;
}

export interface ReviewRequestInput {
  status: 'approved' | 'rejected';
  reviewerNotes?: string;
}

interface RequestRow {
  request_id: string;
  title: string;
  description: string;
  objetivo: string;
  tipo: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  requisitos: string;
  enlaces_complementarios: string;
  numero_contacto: string;
  requester_user_id: string;
  requester_name: string;
  status: RequestStatus;
  reviewer_user_id: string | null;
  reviewer_name: string | null;
  reviewer_notes: string | null;
  convocatoria_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapRequest(row: RequestRow): ConvocatoriaRequest {
  return {
    requestId: row.request_id,
    title: row.title,
    description: row.description,
    objetivo: row.objetivo,
    tipo: row.tipo,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    requisitos: row.requisitos,
    enlacesComplementarios: row.enlaces_complementarios,
    numeroContacto: row.numero_contacto,
    requesterUserId: row.requester_user_id,
    requesterName: row.requester_name,
    status: row.status,
    reviewerUserId: row.reviewer_user_id,
    reviewerName: row.reviewer_name,
    reviewerNotes: row.reviewer_notes,
    convocatoriaId: row.convocatoria_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const REQUEST_SELECT = `
  SELECT
    r.request_id::text,
    r.title,
    r.description,
    r.objetivo,
    r.tipo,
    r.fecha_inicio::text,
    r.fecha_fin::text,
    r.requisitos,
    r.enlaces_complementarios,
    r.numero_contacto,
    r.requester_user_id::text,
    COALESCE(ru.first_name || ' ' || ru.last_name, ru.email, 'Miembro') AS requester_name,
    r.status,
    r.reviewer_user_id::text,
    COALESCE(rv.first_name || ' ' || rv.last_name, rv.email) AS reviewer_name,
    r.reviewer_notes,
    r.convocatoria_id::text,
    r.created_at::text,
    r.updated_at::text
  FROM app_networking.convocatoria_requests r
  JOIN app_core.users ru ON ru.user_id = r.requester_user_id
  LEFT JOIN app_core.users rv ON rv.user_id = r.reviewer_user_id
`;

export async function listRequests(
  client: PoolClient,
  actor: AuthUser,
  filter: 'all' | 'pending' | 'mine' = 'pending',
): Promise<ConvocatoriaRequest[]> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const canManage = await client.query<{ can_manage: boolean }>(
    `SELECT can_manage FROM app_auth.role_module_permissions
     WHERE role_code = $1 AND module_code = 'convocatorias'`,
    [actor.role],
  );

  const isManager = canManage.rows[0]?.can_manage === true;

  let where: string;
  let params: unknown[];

  if (isManager && filter !== 'mine') {
    where = filter === 'pending' ? `WHERE r.status = 'pending'` : '';
    params = [];
  } else {
    where = `WHERE r.requester_user_id = $1`;
    params = [actor.userId];
  }

  const { rows } = await client.query<RequestRow>(
    `${REQUEST_SELECT} ${where} ORDER BY r.created_at DESC LIMIT 100`,
    params,
  );

  return rows.map(mapRequest);
}

export async function createRequest(
  client: PoolClient,
  actor: AuthUser,
  input: CreateRequestInput,
): Promise<ConvocatoriaRequest> {
  await requireModulePermission(client, 'convocatorias', 'view');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  if (!input.title.trim()) throw new Error('El título es requerido');

  const { rows } = await client.query<{ request_id: string }>(
    `INSERT INTO app_networking.convocatoria_requests
       (title, description, objetivo, tipo, fecha_inicio, fecha_fin, requisitos, enlaces_complementarios, numero_contacto, requester_user_id)
     VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8, $9, $10)
     RETURNING request_id::text`,
    [
      input.title.trim(),
      input.description?.trim() ?? '',
      input.objetivo?.trim() ?? '',
      input.tipo ?? 'otra',
      input.fechaInicio || null,
      input.fechaFin || null,
      input.requisitos?.trim() ?? '',
      input.enlacesComplementarios?.trim() ?? '',
      input.numeroContacto?.trim() ?? '',
      actor.userId,
    ],
  );

  const id = rows[0]?.request_id;
  if (!id) throw new Error('Failed to create request');

  const all = await listRequests(client, actor, 'mine');
  const created = all.find((r) => r.requestId === id);
  if (!created) throw new Error('Request not found after creation');

  // Dispatch notifications (fire-and-forget)
  const { rows: orgRows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [actor.userId],
  );
  const organizationId = orgRows[0]?.organization_id;

  if (organizationId) {
    const TIPO_LABELS: Record<string, string> = {
      laboral: 'Laboral', proyecto_social: 'Proyecto Social',
      proveedor: 'Proveedor', convenio: 'Convenio', otra: 'Otra',
    };

    // Notify the leader with confirmation
    void dispatchNotification(client, {
      organizationId,
      recipientUserId: actor.userId,
      recipientEmail: actor.email,
      eventKey: 'convocatorias.request_submitted',
      variables: {
        nombre: actor.name.split(' ')[0] ?? actor.name,
        titulo: input.title.trim(),
        plataforma: '4Shine',
        enlace_plataforma: 'https://app.4shine.co',
      },
    });

    // Notify all gestores and admins
    const { rows: managers } = await client.query<{ user_id: string; email: string; first_name: string | null; last_name: string | null }>(
      `SELECT u.user_id::text, u.email::text, u.first_name, u.last_name
       FROM app_auth.user_roles ur
       JOIN app_core.users u ON u.user_id = ur.user_id
       WHERE ur.role_code = ANY(ARRAY['gestor', 'admin'])
         AND u.is_active = true
         AND u.organization_id = $1`,
      [organizationId],
    );

    for (const manager of managers) {
      const mgrName = [manager.first_name, manager.last_name].filter(Boolean).join(' ') || manager.email;
      void dispatchNotification(client, {
        organizationId,
        recipientUserId: manager.user_id,
        recipientEmail: manager.email,
        eventKey: 'convocatorias.request_received',
        variables: {
          nombre: manager.first_name ?? mgrName,
          lider_nombre: actor.name,
          titulo: input.title.trim(),
          descripcion: input.description?.trim() ?? '',
          tipo_convocatoria: TIPO_LABELS[input.tipo ?? 'otra'] ?? 'Otra',
          objetivo: input.objetivo?.trim() ?? '',
          enlace_plataforma: 'https://app.4shine.co',
          plataforma: '4Shine',
        },
      });
    }
  }

  return created;
}

export async function reviewRequest(
  client: PoolClient,
  actor: AuthUser,
  requestId: string,
  input: ReviewRequestInput,
): Promise<ConvocatoriaRequest> {
  await requireModulePermission(client, 'convocatorias', 'manage');
  await requireCommunityAccess(client, actor, 'Convocatorias');

  const { rowCount } = await client.query(
    `UPDATE app_networking.convocatoria_requests
     SET
       status           = $2,
       reviewer_user_id = $3,
       reviewer_notes   = $4
     WHERE request_id = $1`,
    [requestId, input.status, actor.userId, input.reviewerNotes ?? null],
  );

  if (!rowCount) throw new Error('Request not found');

  const { rows } = await client.query<RequestRow>(
    `${REQUEST_SELECT} WHERE r.request_id = $1`,
    [requestId],
  );

  if (!rows[0]) throw new Error('Request not found');
  return mapRequest(rows[0]);
}

// ── Notification interests ─────────────────────────────────────────────────────

export async function getNotificationInterest(
  client: PoolClient,
  actor: AuthUser,
): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM app_networking.convocatoria_notification_interests WHERE user_id = $1) AS exists`,
    [actor.userId],
  );
  return rows[0]?.exists === true;
}

export async function setNotificationInterest(
  client: PoolClient,
  actor: AuthUser,
  interested: boolean,
): Promise<boolean> {
  if (interested) {
    await client.query(
      `INSERT INTO app_networking.convocatoria_notification_interests (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [actor.userId],
    );
  } else {
    await client.query(
      `DELETE FROM app_networking.convocatoria_notification_interests WHERE user_id = $1`,
      [actor.userId],
    );
  }
  return interested;
}

export async function notifyInterestedUsers(
  client: PoolClient,
  actor: AuthUser,
  convocatoriaId: string,
): Promise<{ notified: number }> {
  await requireModulePermission(client, 'convocatorias', 'update');

  const conv = await getConvocatoria(client, actor, convocatoriaId);

  const { rows: orgRows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [actor.userId],
  );
  const organizationId = orgRows[0]?.organization_id;
  if (!organizationId) return { notified: 0 };

  const { rows: interested } = await client.query<{ user_id: string; email: string; first_name: string | null }>(
    `SELECT u.user_id::text, u.email::text, u.first_name
     FROM app_networking.convocatoria_notification_interests cni
     JOIN app_core.users u ON u.user_id = cni.user_id
     WHERE u.is_active = true AND u.organization_id = $1`,
    [organizationId],
  );

  for (const user of interested) {
    void dispatchNotification(client, {
      organizationId,
      recipientUserId: user.user_id,
      recipientEmail: user.email,
      eventKey: 'convocatorias.published',
      variables: {
        nombre: user.first_name ?? user.email,
        titulo: conv.title,
        descripcion: conv.description,
        fecha_cierre: '',
        enlace_plataforma: `https://app.4shine.co/dashboard/convocatorias/${convocatoriaId}`,
        plataforma: '4Shine',
      },
    });
  }

  return { notified: interested.length };
}
