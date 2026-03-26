import type { PoolClient } from 'pg';
import { getViewerAccessState, requireProgramSubscriptionAccess } from '@/features/access/service';
import type { AuthUser } from '@/server/auth/types';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type {
  ContentCompetencyMetadata,
  ContentStructurePayload,
  ContentStatus,
  ContentType,
} from '@/features/content/service';

export interface LearningCommentRecord {
  commentId: string;
  contentId: string;
  authorUserId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  commentText: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResourceRecord {
  contentId: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  category: string;
  durationMinutes: number | null;
  durationLabel: string | null;
  url: string | null;
  authorName: string | null;
  status: ContentStatus;
  isRecommended: boolean;
  competencyMetadata: ContentCompetencyMetadata;
  tags: string[];
  likes: number;
  liked: boolean;
  progressPercent: number;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  comments: LearningCommentRecord[];
  structurePayload: ContentStructurePayload;
}

export interface CreateLearningCommentInput {
  contentId: string;
  commentText: string;
}

export interface WorkbookEditableFields {
  currentFocus: string;
  leadershipReflection: string;
  actionPlan: string;
  successMetrics: string;
  iShineNotes: string;
}

export type WorkbookStatePayload = Record<string, string>;

export type WorkbookAccessState = 'active' | 'scheduled' | 'disabled' | 'hidden';

export interface WorkbookRecord {
  workbookId: string;
  templateCode: string;
  sequenceNo: number;
  title: string;
  description: string | null;
  pillarCode: string | null;
  availableFrom: string | null;
  isEnabled: boolean;
  isHidden: boolean;
  accessState: WorkbookAccessState;
  ownerUserId: string;
  ownerName: string;
  editableFields: WorkbookEditableFields;
  completionPercent: number;
  statePayload: WorkbookStatePayload;
  lastDownloadedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateWorkbookInput {
  title?: string;
  description?: string | null;
  availableFrom?: string | null;
  isEnabled?: boolean;
  isHidden?: boolean;
  editableFields?: Partial<WorkbookEditableFields>;
  completionPercent?: number;
  statePayload?: WorkbookStatePayload;
  markDownloaded?: boolean;
}

interface LearningCommentRow {
  comment_id: string;
  content_id: string;
  author_user_id: string;
  author_name: string;
  author_avatar: string;
  author_role: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

interface LearningResourceRow {
  content_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  category: string;
  duration_minutes: number | null;
  duration_label: string | null;
  url: string | null;
  author_name: string | null;
  status: ContentStatus;
  is_recommended: boolean;
  competency_metadata: ContentCompetencyMetadata | null;
  tags: string[] | null;
  likes: number;
  liked: boolean;
  progress_percent: number | null;
  seen: boolean | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  comments: LearningCommentRow[] | null;
  structure_payload: ContentStructurePayload | null;
}

interface WorkbookRow {
  workbook_id: string;
  workbook_code: string;
  sequence_no: number;
  title: string;
  description: string | null;
  pillar_code: string | null;
  available_from: string | null;
  is_enabled: boolean;
  is_hidden: boolean;
  owner_user_id: string;
  owner_name: string;
  editable_fields: WorkbookEditableFields | null;
  completion_percent: number;
  state_payload: WorkbookStatePayload | null;
  last_downloaded_at: string | null;
  created_at: string;
  updated_at: string;
}

type WorkbookEditableFieldsInput = Partial<WorkbookEditableFields> & {
  ishinerNotes?: string | null;
};

const DEFAULT_WORKBOOK_FIELDS: WorkbookEditableFields = {
  currentFocus: '',
  leadershipReflection: '',
  actionPlan: '',
  successMetrics: '',
  iShineNotes: '',
};

function normalizeWorkbookFields(
  input: WorkbookEditableFieldsInput | null | undefined,
): WorkbookEditableFields {
  return {
    currentFocus: input?.currentFocus?.trim() ?? '',
    leadershipReflection: input?.leadershipReflection?.trim() ?? '',
    actionPlan: input?.actionPlan?.trim() ?? '',
    successMetrics: input?.successMetrics?.trim() ?? '',
    iShineNotes: input?.iShineNotes?.trim() ?? input?.ishinerNotes?.trim() ?? '',
  };
}

function mergeWorkbookFields(
  currentFields: WorkbookEditableFields,
  updates: WorkbookEditableFieldsInput | undefined,
): WorkbookEditableFields {
  if (!updates) {
    return currentFields;
  }

  return normalizeWorkbookFields({
    ...currentFields,
    ...updates,
  });
}

function normalizeWorkbookStatePayload(input: unknown): WorkbookStatePayload {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const payload: WorkbookStatePayload = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === 'string') {
      payload[key] = value;
    }
  }

  return payload;
}

function calculateWorkbookCompletion(fields: WorkbookEditableFields): number {
  const coreValues = [
    fields.currentFocus,
    fields.leadershipReflection,
    fields.actionPlan,
    fields.successMetrics,
  ];

  const completed = coreValues.filter((value) => value.trim().length > 0).length;
  return Math.round((completed / coreValues.length) * 100);
}

function computeWorkbookAccessState(row: Pick<WorkbookRow, 'available_from' | 'is_enabled' | 'is_hidden'>): WorkbookAccessState {
  if (row.is_hidden) return 'hidden';
  if (!row.is_enabled) return 'disabled';
  if (row.available_from && new Date(row.available_from).getTime() > Date.now()) {
    return 'scheduled';
  }
  return 'active';
}

function mapWorkbookRow(row: WorkbookRow): WorkbookRecord {
  const editableFields = normalizeWorkbookFields(row.editable_fields);

  return {
    workbookId: row.workbook_id,
    templateCode: row.workbook_code,
    sequenceNo: Number(row.sequence_no),
    title: row.title,
    description: row.description,
    pillarCode: row.pillar_code,
    availableFrom: row.available_from,
    isEnabled: row.is_enabled,
    isHidden: row.is_hidden,
    accessState: computeWorkbookAccessState(row),
    ownerUserId: row.owner_user_id,
    ownerName: row.owner_name,
    editableFields,
    completionPercent: Number(row.completion_percent ?? calculateWorkbookCompletion(editableFields)),
    statePayload: normalizeWorkbookStatePayload(row.state_payload),
    lastDownloadedAt: row.last_downloaded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureWorkbookInstances(client: PoolClient, ownerUserId?: string) {
  const params = ownerUserId ? [ownerUserId] : [];
  const ownerFilter = ownerUserId ? 'AND u.user_id = $1' : '';

  await client.query(
    `
      INSERT INTO app_learning.user_workbooks (
        template_id,
        owner_user_id,
        title,
        description,
        available_from,
        editable_fields,
        completion_percent
      )
      SELECT
        wt.template_id,
        u.user_id,
        wt.title,
        wt.description,
        u.created_at + make_interval(days => wt.unlock_offset_days),
        wt.default_fields,
        0
      FROM app_core.users u
      CROSS JOIN app_learning.workbook_templates wt
      LEFT JOIN app_learning.user_workbooks uw
        ON uw.owner_user_id = u.user_id
       AND uw.template_id = wt.template_id
      WHERE u.primary_role = 'lider'
        AND u.is_active = true
        AND (
          EXISTS (
            SELECT 1
            FROM app_core.user_profiles up
            WHERE up.user_id = u.user_id
              AND up.plan_type IN ('premium', 'vip', 'empresa_elite')
          )
          OR EXISTS (
            SELECT 1
            FROM app_billing.user_purchases purchase
            JOIN app_billing.product_catalog catalog
              ON catalog.product_code = purchase.product_code
            WHERE purchase.user_id = u.user_id
              AND purchase.status = 'active'
              AND catalog.product_group = 'program'
          )
        )
        AND wt.is_active = true
        AND uw.workbook_id IS NULL
        ${ownerFilter}
    `,
    params,
  );
}

async function getAccessibleLearningItem(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<{ contentId: string; status: ContentStatus; isFree: boolean }> {
  const access =
    actor.role === 'lider'
      ? await getViewerAccessState(client, actor, { includeCatalog: false })
      : null;

  const { rows } = await client.query<{ content_id: string; status: ContentStatus; is_free: boolean }>(
    `
      SELECT
        ci.content_id::text,
        ci.status,
        EXISTS (
          SELECT 1
          FROM app_learning.content_tags ct
          JOIN app_learning.tags t ON t.tag_id = ct.tag_id
          WHERE ct.content_id = ci.content_id
            AND lower(t.tag_name) = 'free'
        ) AS is_free
      FROM app_learning.content_items ci
      WHERE ci.content_id = $1
        AND ci.scope = 'aprendizaje'
      LIMIT 1
    `,
    [contentId],
  );

  const item = rows[0];
  if (!item) {
    throw new ForbiddenError('Learning resource not found or not accessible');
  }

  if (
    actor.role === 'lider' &&
    access?.freeLearningOnly &&
    (item.status !== 'published' || !item.is_free)
  ) {
    throw new ForbiddenError('Este recurso requiere plan 4Shine para esta cuenta.');
  }

  return {
    contentId: item.content_id,
    status: item.status,
    isFree: item.is_free,
  };
}

async function getWorkbookById(client: PoolClient, workbookId: string): Promise<WorkbookRecord> {
  const { rows } = await client.query<WorkbookRow>(
    `
      SELECT
        uw.workbook_id::text,
        wt.workbook_code,
        wt.sequence_no,
        uw.title,
        uw.description,
        wt.pillar_code,
        uw.available_from::text,
        uw.is_enabled,
        uw.is_hidden,
        uw.owner_user_id::text,
        u.display_name AS owner_name,
        uw.editable_fields,
        uw.completion_percent::float,
        uw.state_payload,
        uw.last_downloaded_at::text,
        uw.created_at::text,
        uw.updated_at::text
      FROM app_learning.user_workbooks uw
      JOIN app_learning.workbook_templates wt ON wt.template_id = uw.template_id
      JOIN app_core.users u ON u.user_id = uw.owner_user_id
      WHERE uw.workbook_id = $1
      LIMIT 1
    `,
    [workbookId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Workbook not found');
  }

  return mapWorkbookRow(row);
}

export async function getWorkbookForActor(
  client: PoolClient,
  actor: AuthUser,
  workbookId: string,
): Promise<WorkbookRecord> {
  await requireModulePermission(client, 'aprendizaje', 'view');

  if (actor.role === 'lider') {
    await requireProgramSubscriptionAccess(client, actor, 'Los workbooks del programa');
  }

  const workbook = await getWorkbookById(client, workbookId);
  const isManager = actor.role === 'gestor' || actor.role === 'admin';
  const isLeaderOwner = actor.role === 'lider' && workbook.ownerUserId === actor.userId;
  const isIShine = actor.role === 'mentor';

  if (!isManager && !isLeaderOwner && !isIShine) {
    throw new ForbiddenError('You do not have access to this workbook');
  }

  if (!isManager && workbook.accessState === 'hidden') {
    throw new ForbiddenError('Workbook not found');
  }

  return workbook;
}

export async function listLearningResources(client: PoolClient, actor: AuthUser): Promise<LearningResourceRecord[]> {
  await requireModulePermission(client, 'aprendizaje', 'view');
  const access =
    actor.role === 'lider'
      ? await getViewerAccessState(client, actor, { includeCatalog: false })
      : null;
  const freeOnly = actor.role === 'lider' && Boolean(access?.freeLearningOnly);

  const { rows } = await client.query<LearningResourceRow>(
    `
      SELECT
        ci.content_id::text,
        ci.title,
        ci.description,
        ci.content_type,
        ci.category,
        ci.duration_minutes,
        ci.duration_label,
        ci.url,
        COALESCE(ci.author_name, au.display_name) AS author_name,
        ci.status,
        ci.is_recommended,
        ci.competency_metadata,
        ci.structure_payload,
        COALESCE(tags.tags, ARRAY[]::text[]) AS tags,
        COALESCE(like_counts.likes, 0)::int AS likes,
        COALESCE(me_liked.liked, false) AS liked,
        COALESCE(cp.progress_percent, 0)::float AS progress_percent,
        COALESCE(cp.seen, false) AS seen,
        ci.created_at::text,
        ci.updated_at::text,
        ci.published_at::text,
        COALESCE(comments.comments, ARRAY[]::json[]) AS comments
      FROM app_learning.content_items ci
      LEFT JOIN app_core.users au ON au.user_id = ci.author_user_id
      LEFT JOIN (
        SELECT ct.content_id, ARRAY_AGG(t.tag_name ORDER BY t.tag_name) AS tags
        FROM app_learning.content_tags ct
        JOIN app_learning.tags t ON t.tag_id = ct.tag_id
        GROUP BY ct.content_id
      ) tags ON tags.content_id = ci.content_id
      LEFT JOIN (
        SELECT content_id, COUNT(*)::int AS likes
        FROM app_learning.content_likes
        GROUP BY content_id
      ) like_counts ON like_counts.content_id = ci.content_id
      LEFT JOIN (
        SELECT content_id, true AS liked
        FROM app_learning.content_likes
        WHERE user_id = $1
      ) me_liked ON me_liked.content_id = ci.content_id
      LEFT JOIN app_learning.content_progress cp
        ON cp.content_id = ci.content_id
       AND cp.user_id = $1
      LEFT JOIN (
        SELECT
          cc.content_id,
          ARRAY_AGG(
            json_build_object(
              'comment_id', cc.comment_id::text,
              'content_id', cc.content_id::text,
              'author_user_id', u.user_id::text,
              'author_name', u.display_name,
              'author_avatar', COALESCE(u.avatar_initial, SUBSTRING(u.display_name FROM 1 FOR 1)),
              'author_role', u.primary_role,
              'comment_text', cc.comment_text,
              'created_at', cc.created_at::text,
              'updated_at', cc.updated_at::text
            )
            ORDER BY cc.created_at DESC
          ) AS comments
        FROM app_learning.content_comments cc
        JOIN app_core.users u ON u.user_id = cc.author_user_id
        GROUP BY cc.content_id
      ) comments ON comments.content_id = ci.content_id
      WHERE ci.scope = 'aprendizaje'
        AND (
          $2::boolean = false
          OR (
            ci.status = 'published'
            AND EXISTS (
              SELECT 1
              FROM app_learning.content_tags ct
              JOIN app_learning.tags t ON t.tag_id = ct.tag_id
              WHERE ct.content_id = ci.content_id
                AND lower(t.tag_name) = 'free'
            )
          )
        )
      ORDER BY
        CASE ci.status
          WHEN 'published' THEN 0
          WHEN 'pending_review' THEN 1
          WHEN 'draft' THEN 2
          WHEN 'archived' THEN 3
          ELSE 4
        END,
        ci.published_at DESC NULLS LAST,
        ci.created_at DESC
      LIMIT 200
    `,
    [actor.userId, freeOnly],
  );

  return rows.map((row) => ({
    contentId: row.content_id,
    title: row.title,
    description: row.description,
    contentType: row.content_type,
    category: row.category,
    durationMinutes: row.duration_minutes,
    durationLabel: row.duration_label,
    url: row.url,
    authorName: row.author_name,
    status: row.status,
    isRecommended: row.is_recommended,
    competencyMetadata: row.competency_metadata ?? {},
    tags: row.tags ?? [],
    likes: Number(row.likes ?? 0),
    liked: row.liked,
    progressPercent: Number(row.progress_percent ?? 0),
    seen: row.seen ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    structurePayload:
      row.structure_payload ?? {
        kind: row.content_type === 'scorm' ? 'course' : 'resource',
        modules: [],
      },
    comments: (row.comments ?? []).map((comment) => ({
      commentId: comment.comment_id,
      contentId: comment.content_id,
      authorUserId: comment.author_user_id,
      authorName: comment.author_name,
      authorAvatar: comment.author_avatar,
      authorRole: comment.author_role,
      commentText: comment.comment_text,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    })),
  }));
}

export async function createLearningComment(
  client: PoolClient,
  actor: AuthUser,
  input: CreateLearningCommentInput,
): Promise<LearningCommentRecord> {
  await requireModulePermission(client, 'aprendizaje', 'view');

  const commentText = input.commentText.trim();
  if (!commentText) {
    throw new Error('Comment text is required');
  }

  await getAccessibleLearningItem(client, actor, input.contentId);

  const { rows } = await client.query<LearningCommentRow>(
    `
      INSERT INTO app_learning.content_comments (
        content_id,
        author_user_id,
        comment_text
      )
      VALUES ($1, $2, $3)
      RETURNING
        comment_id::text,
        content_id::text,
        author_user_id::text,
        $4::text AS author_name,
        $5::text AS author_avatar,
        $6::text AS author_role,
        comment_text,
        created_at::text,
        updated_at::text
    `,
    [
      input.contentId,
      actor.userId,
      commentText,
      actor.name,
      actor.name.charAt(0).toUpperCase() || 'U',
      actor.role,
    ],
  );

  const created = rows[0];
  if (!created) {
    throw new Error('Failed to create learning comment');
  }

  return {
    commentId: created.comment_id,
    contentId: created.content_id,
    authorUserId: created.author_user_id,
    authorName: created.author_name,
    authorAvatar: created.author_avatar,
    authorRole: created.author_role,
    commentText: created.comment_text,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  };
}

export async function listWorkbooks(
  client: PoolClient,
  actor: AuthUser,
  options?: { ownerUserId?: string },
): Promise<WorkbookRecord[]> {
  await requireModulePermission(client, 'aprendizaje', 'view');

  if (actor.role === 'lider') {
    const access = await getViewerAccessState(client, actor, { includeCatalog: false });
    if (!access.canAccessProgramWorkbooks) {
      return [];
    }
  }

  const ownerUserId = actor.role === 'lider' ? actor.userId : options?.ownerUserId;
  await ensureWorkbookInstances(client, ownerUserId);

  const includeHidden = actor.role === 'gestor' || actor.role === 'admin';
  const { rows } = await client.query<WorkbookRow>(
    `
      SELECT
        uw.workbook_id::text,
        wt.workbook_code,
        wt.sequence_no,
        uw.title,
        uw.description,
        wt.pillar_code,
        uw.available_from::text,
        uw.is_enabled,
        uw.is_hidden,
        uw.owner_user_id::text,
        u.display_name AS owner_name,
        uw.editable_fields,
        uw.completion_percent::float,
        NULL::jsonb AS state_payload,
        uw.last_downloaded_at::text,
        uw.created_at::text,
        uw.updated_at::text
      FROM app_learning.user_workbooks uw
      JOIN app_learning.workbook_templates wt ON wt.template_id = uw.template_id
      JOIN app_core.users u ON u.user_id = uw.owner_user_id
      WHERE ($1::uuid IS NULL OR uw.owner_user_id = $1::uuid)
        AND ($2::boolean = true OR uw.is_hidden = false)
      ORDER BY u.display_name, wt.sequence_no
    `,
    [ownerUserId ?? null, includeHidden],
  );

  return rows.map(mapWorkbookRow);
}

export async function updateWorkbook(
  client: PoolClient,
  actor: AuthUser,
  workbookId: string,
  input: UpdateWorkbookInput,
): Promise<WorkbookRecord> {
  await requireModulePermission(client, 'aprendizaje', 'update');

  if (actor.role === 'lider') {
    await requireProgramSubscriptionAccess(client, actor, 'La edición de workbooks');
  }

  const current = await getWorkbookById(client, workbookId);
  const isManager = actor.role === 'gestor' || actor.role === 'admin';
  const isLeaderOwner = actor.role === 'lider' && current.ownerUserId === actor.userId;
  const isIShine = actor.role === 'mentor';

  if (!isManager && !isLeaderOwner && !isIShine) {
    throw new ForbiddenError('You do not have access to this workbook');
  }

  if (!isManager && current.accessState !== 'active') {
    throw new ForbiddenError('Workbook is not enabled for editing yet');
  }

  if (!isManager) {
    const hasRestrictedFields =
      input.title !== undefined ||
      input.description !== undefined ||
      input.availableFrom !== undefined ||
      input.isEnabled !== undefined ||
      input.isHidden !== undefined;

    if (hasRestrictedFields) {
      throw new ForbiddenError('Only gestores and admins can manage workbook visibility and schedule');
    }
  }

  const mergedFields = mergeWorkbookFields(current.editableFields, input.editableFields);
  const requestedCompletionPercent =
    typeof input.completionPercent === 'number' && Number.isFinite(input.completionPercent)
      ? Math.max(0, Math.min(100, Math.round(input.completionPercent)))
      : null;
  const completionPercent = requestedCompletionPercent ?? calculateWorkbookCompletion(mergedFields);
  const hasStatePayload = input.statePayload !== undefined;
  const statePayload = hasStatePayload
    ? normalizeWorkbookStatePayload(input.statePayload)
    : current.statePayload;

  const { rows } = await client.query<{ workbook_id: string }>(
    `
      UPDATE app_learning.user_workbooks
      SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        available_from = COALESCE($4::timestamptz, available_from),
        is_enabled = COALESCE($5, is_enabled),
        is_hidden = COALESCE($6, is_hidden),
        editable_fields = $7::jsonb,
        completion_percent = $8,
        last_downloaded_at = CASE WHEN $9 THEN now() ELSE last_downloaded_at END,
        state_payload = CASE WHEN $10 THEN $11::jsonb ELSE state_payload END,
        updated_at = now()
      WHERE workbook_id = $1
      RETURNING workbook_id::text
    `,
    [
      workbookId,
      isManager ? input.title ?? null : null,
      isManager ? input.description ?? null : null,
      isManager ? input.availableFrom ?? null : null,
      isManager ? input.isEnabled ?? null : null,
      isManager ? input.isHidden ?? null : null,
      JSON.stringify(mergedFields),
      completionPercent,
      input.markDownloaded ?? false,
      hasStatePayload,
      JSON.stringify(statePayload),
    ],
  );

  if (!rows[0]) {
    throw new Error('Workbook not found');
  }

  return getWorkbookById(client, workbookId);
}

export async function deleteWorkbook(
  client: PoolClient,
  actor: AuthUser,
  workbookId: string,
): Promise<{ workbookId: string }> {
  await requireModulePermission(client, 'aprendizaje', 'delete');

  const isManager = actor.role === 'gestor' || actor.role === 'admin';
  if (!isManager) {
    throw new ForbiddenError('Only gestores and admins can delete workbooks');
  }

  const { rows } = await client.query<{ workbook_id: string }>(
    `
      DELETE FROM app_learning.user_workbooks
      WHERE workbook_id = $1
      RETURNING workbook_id::text
    `,
    [workbookId],
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new Error('Workbook not found');
  }

  return {
    workbookId: deleted.workbook_id,
  };
}

export { DEFAULT_WORKBOOK_FIELDS };
