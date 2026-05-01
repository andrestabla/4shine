import type { PoolClient } from 'pg';
import { getViewerAccessState, requireProgramSubscriptionAccess } from '@/features/access/service';
import {
  buildEmptyLearningCommentReactions,
  isLearningCommentReactionType,
  mergeLearningCommentReactions,
  type LearningCommentReactionSummary,
  type LearningCommentReactionType,
} from '@/features/aprendizaje/comment-reactions';
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
  reactions: LearningCommentReactionSummary[];
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
  commentCount: number;
  progressPercent: number;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  comments: LearningCommentRecord[];
  structurePayload: ContentStructurePayload;
  completedResourceIds: string[];
  certificateTemplateId: string | null;
  scormState: Record<string, string>;
}


export interface LearningResourceListQuery {
  q?: string;
  family?: 'resource' | 'course' | null;
  contentType?: ContentType | null;
  status?: ContentStatus | null;
  pillar?: string | null;
  page?: number;
  pageSize?: number;
}

export interface LearningResourceListResult {
  items: LearningResourceRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LearningLikeToggleResult {
  contentId: string;
  liked: boolean;
  likes: number;
}

export interface LearningProgressUpdateInput {
  resourceId?: string;
  progressPercent?: number;
  scormState?: Record<string, unknown>;
}

const SCORM_PACKAGE_COMPLETION_ID = '__scorm_package__';
let hasScormRuntimeStateColumnCache: boolean | null = null;

export interface LearningProgressUpdateResult {
  contentId: string;
  progressPercent: number;
  seen: boolean;
}

export interface ToggleLearningCommentReactionInput {
  commentId: string;
  reactionType: LearningCommentReactionType;
}

export interface LearningCommentReactionToggleResult {
  commentId: string;
  reactions: LearningCommentReactionSummary[];
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
  reactions: Array<{
    reactionType?: string | null;
    count?: number | null;
    reacted?: boolean | null;
  }> | null;
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
  comment_count: number;
  progress_percent: number | null;
  seen: boolean | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  thumbnail_url: string | null;
  comments: LearningCommentRow[] | null;
  structure_payload: ContentStructurePayload | null;
  completed_resource_ids: string[] | null;
  certificate_template_id: string | null;
  scorm_runtime_state: Record<string, unknown> | null;
}

function getCourseResourceFallbackId(moduleId: string | null | undefined, moduleIndex: number, resourceId: string | null | undefined, resourceIndex: number): string {
  const normalizedModuleId =
    typeof moduleId === 'string' && moduleId.trim().length > 0
      ? moduleId.trim()
      : `module-${moduleIndex + 1}`;
  const normalizedResourceId =
    typeof resourceId === 'string' && resourceId.trim().length > 0
      ? resourceId.trim()
      : `resource-${resourceIndex + 1}`;
  return `${normalizedModuleId}::${normalizedResourceId}`;
}

function getCourseResourceIds(structurePayload: ContentStructurePayload | null | undefined): string[] {
  const modules = Array.isArray(structurePayload?.modules) ? structurePayload.modules : [];
  const resourceIds: string[] = [];

  modules.forEach((module, moduleIndex) => {
    if (!module || typeof module !== 'object') {
      return;
    }

    const resources = Array.isArray(module.resources) ? module.resources : [];
    resources.forEach((resource, resourceIndex) => {
      if (!resource || typeof resource !== 'object') {
        return;
      }

      resourceIds.push(
        getCourseResourceFallbackId(module.id, moduleIndex, resource.id, resourceIndex),
      );
    });
  });

  return resourceIds;
}

function getValidCompletedResourceIds(
  structurePayload: ContentStructurePayload | null | undefined,
  completedResourceIds: string[] | null | undefined,
): string[] {
  const validIds = new Set(getCourseResourceIds(structurePayload));
  if (validIds.size === 0) {
    return [];
  }

  const seen = new Set<string>();
  const normalizedCompletedIds: string[] = [];

  for (const item of completedResourceIds ?? []) {
    if (typeof item !== 'string') continue;
    const normalizedItem = item.trim();
    if (!normalizedItem || !validIds.has(normalizedItem) || seen.has(normalizedItem)) continue;
    seen.add(normalizedItem);
    normalizedCompletedIds.push(normalizedItem);
  }

  return normalizedCompletedIds;
}

function calculateCourseProgress(
  structurePayload: ContentStructurePayload | null | undefined,
  completedResourceIds: string[] | null | undefined,
  fallbackProgressPercent: number | null | undefined,
): number {
  const totalResources = getCourseResourceIds(structurePayload).length;
  if (totalResources === 0) {
    return Number(fallbackProgressPercent ?? 0);
  }

  const completedCount = getValidCompletedResourceIds(structurePayload, completedResourceIds).length;
  return Math.min(100, Math.round((completedCount / totalResources) * 100));
}

function mapLearningComments(comments: LearningCommentRow[] | null | undefined): LearningCommentRecord[] {
  return (comments ?? []).map((comment) => ({
    commentId: comment.comment_id,
    contentId: comment.content_id,
    authorUserId: comment.author_user_id,
    authorName: comment.author_name,
    authorAvatar: comment.author_avatar,
    authorRole: comment.author_role,
    commentText: comment.comment_text,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    reactions: mergeLearningCommentReactions(comment.reactions),
  }));
}

function normalizeScormState(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const output: Record<string, string> = {};
  for (const [key, raw] of Object.entries(source)) {
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey.startsWith('cmi.')) continue;
    if (normalizedKey.length > 128) continue;
    output[normalizedKey] = String(raw ?? '').slice(0, 65535);
  }
  return output;
}

async function hasScormRuntimeStateColumn(client: PoolClient): Promise<boolean> {
  if (hasScormRuntimeStateColumnCache !== null) return hasScormRuntimeStateColumnCache;
  const { rows } = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'app_learning'
          AND table_name = 'content_progress'
          AND column_name = 'scorm_runtime_state'
      ) AS exists
    `,
  );
  hasScormRuntimeStateColumnCache = Boolean(rows[0]?.exists);
  return hasScormRuntimeStateColumnCache;
}

function mapLearningResourceRow(row: LearningResourceRow): LearningResourceRecord {
  const validCompletedResourceIds = getValidCompletedResourceIds(
    row.structure_payload,
    row.completed_resource_ids,
  );
  const isCourse = row.content_type === 'scorm';
  const hasScormPackageEntry = isCourse && typeof row.url === 'string' && row.url.trim().length > 0;
  const progressPercent = isCourse
    ? calculateCourseProgress(row.structure_payload, validCompletedResourceIds, row.progress_percent)
    : Number(row.progress_percent ?? 0);
  const seen = isCourse
    ? progressPercent >= 100 && (getCourseResourceIds(row.structure_payload).length > 0 || hasScormPackageEntry)
    : row.seen ?? false;

  return {
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
    commentCount: Number(row.comment_count ?? 0),
    progressPercent,
    seen,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    thumbnailUrl: row.thumbnail_url,
    structurePayload: row.structure_payload ?? {
        kind: row.content_type === 'scorm' ? 'course' : 'resource',
        modules: [],
      },
    completedResourceIds: validCompletedResourceIds,
    certificateTemplateId: row.certificate_template_id ?? null,
    scormState: normalizeScormState(row.scorm_runtime_state),
    comments: mapLearningComments(row.comments),
  };
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
  await requireModulePermission(client, 'aprendizaje', 'view');

  const canManage = actor.role === 'gestor' || actor.role === 'admin';
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

  if (!canManage && item.status !== 'published') {
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

export async function listLearningResources(
  client: PoolClient,
  actor: AuthUser,
  query?: LearningResourceListQuery,
): Promise<LearningResourceListResult> {
  await requireModulePermission(client, 'aprendizaje', 'view');
  const canManage = actor.role === 'gestor' || actor.role === 'admin';
  const access =
    actor.role === 'lider'
      ? await getViewerAccessState(client, actor, { includeCatalog: false })
      : null;
  const freeOnly = actor.role === 'lider' && Boolean(access?.freeLearningOnly);
  const normalizedQuery = query?.q?.trim() ? `%${query.q.trim().toLowerCase()}%` : null;
  const page = Math.max(query?.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query?.pageSize ?? 24, 1), 48);
  const offset = (page - 1) * pageSize;
  const statusFilter = canManage ? query?.status ?? null : null;
  const familyFilter = query?.family ?? null;

  const countResult = await client.query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM app_learning.content_items ci
      WHERE ci.scope = 'aprendizaje'
        AND ($1::boolean = true OR ci.status = 'published')
        AND (
          $2::boolean = false
          OR EXISTS (
            SELECT 1
            FROM app_learning.content_tags ct
            JOIN app_learning.tags t ON t.tag_id = ct.tag_id
            WHERE ct.content_id = ci.content_id
              AND lower(t.tag_name) = 'free'
          )
        )
        AND (
          $3::text IS NULL
          OR ($3::text = 'course' AND ci.content_type = 'scorm')
          OR ($3::text = 'resource' AND ci.content_type <> 'scorm')
        )
        AND ($4::text IS NULL OR ci.content_type = $4)
        AND ($5::text IS NULL OR ci.status = $5)
        AND ($6::text IS NULL OR COALESCE(ci.competency_metadata->>'pillar', '') = $6)
        AND (
          $7::text IS NULL
          OR lower(ci.title) LIKE $7
          OR lower(COALESCE(ci.description, '')) LIKE $7
          OR lower(ci.category) LIKE $7
          OR lower(COALESCE(ci.competency_metadata->>'component', '')) LIKE $7
          OR lower(COALESCE(ci.competency_metadata->>'competency', '')) LIKE $7
          OR lower(COALESCE(ci.competency_metadata->>'stage', '')) LIKE $7
          OR EXISTS (
            SELECT 1
            FROM app_learning.content_tags ct
            JOIN app_learning.tags t ON t.tag_id = ct.tag_id
            WHERE ct.content_id = ci.content_id
              AND lower(t.tag_name) LIKE $7
          )
        )
    `,
    [
      canManage,
      freeOnly,
      familyFilter,
      query?.contentType ?? null,
      statusFilter,
      query?.pillar ?? null,
      normalizedQuery,
    ],
  );

  const total = Number(countResult.rows[0]?.total ?? 0);

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
        NULL::text AS author_name,
        ci.status,
        ci.is_recommended,
        ci.competency_metadata,
        ci.structure_payload,
        COALESCE(tags.tags, ARRAY[]::text[]) AS tags,
        COALESCE(like_counts.likes, 0)::int AS likes,
        COALESCE(me_liked.liked, false) AS liked,
        COALESCE(comment_counts.comment_count, 0)::int AS comment_count,
        COALESCE(cp.progress_percent, 0)::float AS progress_percent,
        COALESCE(cp.seen, false) AS seen,
        cp.completed_resource_ids,
        (to_jsonb(cp)->'scorm_runtime_state') AS scorm_runtime_state,
        ci.created_at::text,
        ci.updated_at::text,
        ci.published_at::text,
        ci.thumbnail_url,
        ci.certificate_template_id::text,
        ARRAY[]::json[] AS comments
      FROM app_learning.content_items ci
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
        SELECT content_id, COUNT(*)::int AS comment_count
        FROM app_learning.content_comments
        GROUP BY content_id
      ) comment_counts ON comment_counts.content_id = ci.content_id
      LEFT JOIN (
        SELECT content_id, true AS liked
        FROM app_learning.content_likes
        WHERE user_id = $1
      ) me_liked ON me_liked.content_id = ci.content_id
      LEFT JOIN app_learning.content_progress cp
        ON cp.content_id = ci.content_id
       AND cp.user_id = $1
      WHERE ci.scope = 'aprendizaje'
        AND ($2::boolean = true OR ci.status = 'published')
        AND (
          $3::boolean = false
          OR EXISTS (
            SELECT 1
            FROM app_learning.content_tags ct
            JOIN app_learning.tags t ON t.tag_id = ct.tag_id
            WHERE ct.content_id = ci.content_id
              AND lower(t.tag_name) = 'free'
          )
        )
        AND (
          $4::text IS NULL
          OR ($4::text = 'course' AND ci.content_type = 'scorm')
          OR ($4::text = 'resource' AND ci.content_type <> 'scorm')
        )
        AND ($5::text IS NULL OR ci.content_type = $5)
        AND ($6::text IS NULL OR ci.status = $6)
        AND ($7::text IS NULL OR COALESCE(ci.competency_metadata->>'pillar', '') = $7)
        AND (
          $8::text IS NULL
          OR lower(ci.title) LIKE $8
          OR lower(COALESCE(ci.description, '')) LIKE $8
          OR lower(ci.category) LIKE $8
          OR lower(COALESCE(ci.competency_metadata->>'component', '')) LIKE $8
          OR lower(COALESCE(ci.competency_metadata->>'competency', '')) LIKE $8
          OR lower(COALESCE(ci.competency_metadata->>'stage', '')) LIKE $8
          OR EXISTS (
            SELECT 1
            FROM app_learning.content_tags ct
            JOIN app_learning.tags t ON t.tag_id = ct.tag_id
            WHERE ct.content_id = ci.content_id
              AND lower(t.tag_name) LIKE $8
          )
        )
      ORDER BY
        ci.is_recommended DESC,
        CASE ci.status
          WHEN 'published' THEN 0
          WHEN 'pending_review' THEN 1
          WHEN 'draft' THEN 2
          WHEN 'archived' THEN 3
          ELSE 4
        END,
        ci.published_at DESC NULLS LAST,
        ci.created_at DESC
      LIMIT $9
      OFFSET $10
    `,
    [
      actor.userId,
      canManage,
      freeOnly,
      familyFilter,
      query?.contentType ?? null,
      statusFilter,
      query?.pillar ?? null,
      normalizedQuery,
      pageSize,
      offset,
    ],
  );

  return {
    items: rows.map(mapLearningResourceRow),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLearningResourceDetail(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<LearningResourceRecord> {
  await getAccessibleLearningItem(client, actor, contentId);

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
        NULL::text AS author_name,
        ci.status,
        ci.is_recommended,
        ci.competency_metadata,
        ci.structure_payload,
        COALESCE(tags.tags, ARRAY[]::text[]) AS tags,
        COALESCE(like_counts.likes, 0)::int AS likes,
        COALESCE(me_liked.liked, false) AS liked,
        COALESCE(comment_counts.comment_count, 0)::int AS comment_count,
        COALESCE(cp.progress_percent, 0)::float AS progress_percent,
        COALESCE(cp.seen, false) AS seen,
        cp.completed_resource_ids,
        (to_jsonb(cp)->'scorm_runtime_state') AS scorm_runtime_state,
        ci.created_at::text,
        ci.updated_at::text,
        ci.published_at::text,
        ci.thumbnail_url,
        ci.certificate_template_id::text,
        COALESCE(comments.comments, ARRAY[]::json[]) AS comments
      FROM app_learning.content_items ci
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
      LEFT JOIN (
        SELECT content_id, COUNT(*)::int AS comment_count
        FROM app_learning.content_comments
        GROUP BY content_id
      ) comment_counts ON comment_counts.content_id = ci.content_id
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
              'updated_at', cc.updated_at::text,
              'reactions', COALESCE(reaction_rows.reactions, '[]'::json)
            )
            ORDER BY cc.created_at DESC
          ) AS comments
        FROM app_learning.content_comments cc
        JOIN app_core.users u ON u.user_id = cc.author_user_id
        LEFT JOIN LATERAL (
          SELECT
            COALESCE(
              json_agg(
                json_build_object(
                  'reactionType', reaction_counts.reaction_type,
                  'count', reaction_counts.reaction_count,
                  'reacted', COALESCE(my_reactions.reacted, false)
                )
                ORDER BY reaction_counts.reaction_type
              ),
              '[]'::json
            ) AS reactions
          FROM (
            SELECT reaction_type, COUNT(*)::int AS reaction_count
            FROM app_learning.content_comment_reactions
            WHERE comment_id = cc.comment_id
            GROUP BY reaction_type
          ) reaction_counts
          LEFT JOIN (
            SELECT reaction_type, true AS reacted
            FROM app_learning.content_comment_reactions
            WHERE comment_id = cc.comment_id
              AND user_id = $1
            GROUP BY reaction_type
          ) my_reactions
            ON my_reactions.reaction_type = reaction_counts.reaction_type
        ) reaction_rows ON true
        GROUP BY cc.content_id
      ) comments ON comments.content_id = ci.content_id
      WHERE ci.scope = 'aprendizaje'
        AND ci.content_id = $2
      LIMIT 1
    `,
    [actor.userId, contentId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Learning resource not found');
  }

  return mapLearningResourceRow(row);
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
    reactions: buildEmptyLearningCommentReactions(),
  };
}

async function getLearningCommentReactions(
  client: PoolClient,
  actorUserId: string,
  commentId: string,
): Promise<LearningCommentReactionSummary[]> {
  const { rows } = await client.query<{
    reaction_type: string;
    count: number;
    reacted: boolean;
  }>(
    `
      WITH counts AS (
        SELECT reaction_type, COUNT(*)::int AS count
        FROM app_learning.content_comment_reactions
        WHERE comment_id = $1
        GROUP BY reaction_type
      ),
      mine AS (
        SELECT reaction_type, true AS reacted
        FROM app_learning.content_comment_reactions
        WHERE comment_id = $1
          AND user_id = $2
      )
      SELECT
        COALESCE(counts.reaction_type, mine.reaction_type) AS reaction_type,
        COALESCE(counts.count, 0)::int AS count,
        COALESCE(mine.reacted, false) AS reacted
      FROM counts
      FULL OUTER JOIN mine
        ON mine.reaction_type = counts.reaction_type
    `,
    [commentId, actorUserId],
  );

  return mergeLearningCommentReactions(
    rows.map((row) => ({
      reactionType: row.reaction_type,
      count: Number(row.count ?? 0),
      reacted: row.reacted,
    })),
  );
}

export async function toggleLearningCommentReaction(
  client: PoolClient,
  actor: AuthUser,
  input: ToggleLearningCommentReactionInput,
): Promise<LearningCommentReactionToggleResult> {
  await requireModulePermission(client, 'aprendizaje', 'view');

  if (!isLearningCommentReactionType(input.reactionType)) {
    throw new Error('Invalid reaction type');
  }

  const commentLookup = await client.query<{ comment_id: string; content_id: string }>(
    `
      SELECT comment_id::text, content_id::text
      FROM app_learning.content_comments
      WHERE comment_id = $1
      LIMIT 1
    `,
    [input.commentId],
  );

  const comment = commentLookup.rows[0];
  if (!comment) {
    throw new Error('Learning comment not found');
  }

  await getAccessibleLearningItem(client, actor, comment.content_id);

  const existing = await client.query<{ comment_id: string }>(
    `
      SELECT comment_id::text
      FROM app_learning.content_comment_reactions
      WHERE comment_id = $1
        AND user_id = $2
        AND reaction_type = $3
      LIMIT 1
    `,
    [input.commentId, actor.userId, input.reactionType],
  );

  if (existing.rows[0]) {
    await client.query(
      `
        DELETE FROM app_learning.content_comment_reactions
        WHERE comment_id = $1
          AND user_id = $2
          AND reaction_type = $3
      `,
      [input.commentId, actor.userId, input.reactionType],
    );
  } else {
    await client.query(
      `
        INSERT INTO app_learning.content_comment_reactions (
          comment_id,
          user_id,
          reaction_type
        )
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `,
      [input.commentId, actor.userId, input.reactionType],
    );
  }

  return {
    commentId: input.commentId,
    reactions: await getLearningCommentReactions(client, actor.userId, input.commentId),
  };
}

export async function updateLearningProgress(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
  input: LearningProgressUpdateInput,
): Promise<LearningProgressUpdateResult> {
  await requireModulePermission(client, 'aprendizaje', 'view');
  const resource = await getLearningResourceDetail(client, actor, contentId);
  const normalizedResourceId =
    typeof input.resourceId === 'string' ? input.resourceId.trim() : '';
  const reportedProgressPercent =
    typeof input.progressPercent === 'number' && Number.isFinite(input.progressPercent)
      ? Math.min(100, Math.max(0, Math.round(input.progressPercent)))
      : null;
  const validCourseResourceIds = new Set(getCourseResourceIds(resource.structurePayload));
  const isScormCourse = resource.contentType === 'scorm';
  const normalizedScormState = isScormCourse ? normalizeScormState(input.scormState) : {};
  const isScormPackageCourse =
    isScormCourse &&
    validCourseResourceIds.size === 0 &&
    typeof resource.url === 'string' &&
    resource.url.trim().length > 0;
  const isScormRuntimeSignal =
    isScormCourse &&
    (normalizedResourceId === SCORM_PACKAGE_COMPLETION_ID || reportedProgressPercent !== null);

  const hasValidResourceId = normalizedResourceId && validCourseResourceIds.has(normalizedResourceId);
  if (!hasValidResourceId && !isScormRuntimeSignal) {
    throw new Error('Learning course resource not found');
  }

  const updatedCompletedIds = isScormPackageCourse || !hasValidResourceId
    ? []
    : Array.from(new Set([...(resource.completedResourceIds || []), normalizedResourceId]));
  const totalItems = validCourseResourceIds.size;
  const progressFromResources =
    totalItems > 0 ? Math.min(100, Math.round((updatedCompletedIds.length / totalItems) * 100)) : 0;
  const persistedProgress = Math.min(100, Math.max(0, Math.round(resource.progressPercent ?? 0)));
  const runtimeProgressPercent = reportedProgressPercent ?? (normalizedResourceId === SCORM_PACKAGE_COMPLETION_ID ? 100 : 0);
  const progressPercent = isScormRuntimeSignal
    ? Math.max(persistedProgress, progressFromResources, runtimeProgressPercent)
    : Math.max(persistedProgress, progressFromResources);
  const seen = progressPercent >= 100;
  const supportsScormRuntimeState = await hasScormRuntimeStateColumn(client);

  const queryText = supportsScormRuntimeState
    ? `
        INSERT INTO app_learning.content_progress (
          content_id, 
          user_id, 
          progress_percent, 
          seen, 
          completed_resource_ids,
          scorm_runtime_state,
          last_viewed_at,
          started_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (content_id, user_id) 
        DO UPDATE SET
          completed_resource_ids = (
            SELECT jsonb_agg(DISTINCT x) 
            FROM jsonb_array_elements(COALESCE(app_learning.content_progress.completed_resource_ids, '[]'::jsonb) || $5::jsonb) t(x)
          ),
          scorm_runtime_state = COALESCE(app_learning.content_progress.scorm_runtime_state, '{}'::jsonb) || $6::jsonb,
          progress_percent = $3,
          seen = app_learning.content_progress.seen OR $4,
          last_viewed_at = NOW(),
          completed_at = CASE 
            WHEN (app_learning.content_progress.progress_percent < 100 AND $3 >= 100) 
            THEN NOW() 
            ELSE app_learning.content_progress.completed_at 
          END
        RETURNING progress_percent, seen
      `
    : `
        INSERT INTO app_learning.content_progress (
          content_id, 
          user_id, 
          progress_percent, 
          seen, 
          completed_resource_ids,
          last_viewed_at,
          started_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (content_id, user_id) 
        DO UPDATE SET
          completed_resource_ids = (
            SELECT jsonb_agg(DISTINCT x) 
            FROM jsonb_array_elements(COALESCE(app_learning.content_progress.completed_resource_ids, '[]'::jsonb) || $5::jsonb) t(x)
          ),
          progress_percent = $3,
          seen = app_learning.content_progress.seen OR $4,
          last_viewed_at = NOW(),
          completed_at = CASE 
            WHEN (app_learning.content_progress.progress_percent < 100 AND $3 >= 100) 
            THEN NOW() 
            ELSE app_learning.content_progress.completed_at 
          END
        RETURNING progress_percent, seen
      `;

  const queryValues = supportsScormRuntimeState
    ? [
        contentId,
        actor.userId,
        progressPercent,
        seen,
        JSON.stringify(updatedCompletedIds),
        JSON.stringify(normalizedScormState),
      ]
    : [contentId, actor.userId, progressPercent, seen, JSON.stringify(updatedCompletedIds)];

  const { rows } = await client.query<{ progress_percent: number; seen: boolean }>(
    queryText,
    queryValues,
  );

  return {
    contentId,
    progressPercent: Number(rows[0].progress_percent),
    seen: rows[0].seen,
  };
}

export async function toggleLearningLike(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<LearningLikeToggleResult> {
  await requireModulePermission(client, 'aprendizaje', 'view');
  await getAccessibleLearningItem(client, actor, contentId);

  const existing = await client.query<{ content_id: string }>(
    `
      SELECT content_id::text
      FROM app_learning.content_likes
      WHERE content_id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [contentId, actor.userId],
  );

  let liked = false;
  if (existing.rows[0]) {
    await client.query(
      `
        DELETE FROM app_learning.content_likes
        WHERE content_id = $1
          AND user_id = $2
      `,
      [contentId, actor.userId],
    );
  } else {
    await client.query(
      `
        INSERT INTO app_learning.content_likes (content_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [contentId, actor.userId],
    );
    liked = true;
  }

  const { rows } = await client.query<{ likes: number }>(
    `
      SELECT COUNT(*)::int AS likes
      FROM app_learning.content_likes
      WHERE content_id = $1
    `,
    [contentId],
  );

  return {
    contentId,
    liked,
    likes: Number(rows[0]?.likes ?? 0),
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

import type { CertificateElement } from '@/lib/certificate-elements';

export interface CertificateTemplateRecord {
  templateId: string;
  templateNumber: number;
  name: string;
  headlineText: string;
  bodyText: string;
  organizationName: string;
  signatoryName: string;
  signatoryTitle: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  footerText: string;
  accentColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  elements: CertificateElement[] | null;
}

export interface UpdateCertificateTemplateInput {
  name?: string;
  headlineText?: string;
  bodyText?: string;
  organizationName?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  footerText?: string;
  accentColor?: string;
  elements?: CertificateElement[] | null;
}

interface CertificateTemplateRow {
  template_id: string;
  template_number: number;
  name: string;
  headline_text: string;
  body_text: string;
  organization_name: string;
  signatory_name: string;
  signatory_title: string;
  logo_url: string | null;
  signature_url: string | null;
  footer_text: string;
  accent_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  elements: CertificateElement[] | null;
}

function mapCertificateTemplateRow(row: CertificateTemplateRow): CertificateTemplateRecord {
  return {
    templateId: row.template_id,
    templateNumber: row.template_number,
    name: row.name,
    headlineText: row.headline_text,
    bodyText: row.body_text,
    organizationName: row.organization_name,
    signatoryName: row.signatory_name,
    signatoryTitle: row.signatory_title,
    logoUrl: row.logo_url,
    signatureUrl: row.signature_url,
    footerText: row.footer_text,
    accentColor: row.accent_color,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    elements: row.elements ?? null,
  };
}

export async function listCertificateTemplates(
  client: PoolClient,
  actor: AuthUser,
): Promise<CertificateTemplateRecord[]> {
  await requireModulePermission(client, 'aprendizaje', 'view');

  const isManager = actor.role === 'gestor' || actor.role === 'admin';
  if (!isManager) {
    throw new ForbiddenError('Only gestores and admins can manage certificate templates');
  }

  const { rows } = await client.query<CertificateTemplateRow>(
    `SELECT template_id::text, template_number, name, headline_text, body_text,
            organization_name, signatory_name, signatory_title,
            logo_url, signature_url, footer_text, accent_color, is_active,
            elements, created_at::text, updated_at::text
     FROM app_learning.certificate_templates
     ORDER BY template_number ASC`,
  );

  return rows.map(mapCertificateTemplateRow);
}

export async function updateCertificateTemplate(
  client: PoolClient,
  actor: AuthUser,
  templateId: string,
  input: UpdateCertificateTemplateInput,
): Promise<CertificateTemplateRecord> {
  await requireModulePermission(client, 'aprendizaje', 'update');

  const isManager = actor.role === 'gestor' || actor.role === 'admin';
  if (!isManager) {
    throw new ForbiddenError('Only gestores and admins can update certificate templates');
  }

  const { rows } = await client.query<CertificateTemplateRow>(
    `UPDATE app_learning.certificate_templates SET
       name             = COALESCE($2, name),
       headline_text    = COALESCE($3, headline_text),
       body_text        = COALESCE($4, body_text),
       organization_name = COALESCE($5, organization_name),
       signatory_name   = COALESCE($6, signatory_name),
       signatory_title  = COALESCE($7, signatory_title),
       logo_url         = CASE WHEN $8::boolean THEN $9 ELSE logo_url END,
       signature_url    = CASE WHEN $10::boolean THEN $11 ELSE signature_url END,
       footer_text      = COALESCE($12, footer_text),
       accent_color     = COALESCE($13, accent_color),
       elements         = CASE WHEN $14::boolean THEN $15::jsonb ELSE elements END,
       updated_at       = now()
     WHERE template_id = $1::uuid
     RETURNING template_id::text, template_number, name, headline_text, body_text,
               organization_name, signatory_name, signatory_title,
               logo_url, signature_url, footer_text, accent_color, is_active,
               elements, created_at::text, updated_at::text`,
    [
      templateId,
      input.name ?? null,
      input.headlineText ?? null,
      input.bodyText ?? null,
      input.organizationName ?? null,
      input.signatoryName ?? null,
      input.signatoryTitle ?? null,
      'logoUrl' in input,
      input.logoUrl ?? null,
      'signatureUrl' in input,
      input.signatureUrl ?? null,
      input.footerText ?? null,
      input.accentColor ?? null,
      'elements' in input,
      input.elements != null ? JSON.stringify(input.elements) : null,
    ],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Certificate template not found');
  }

  return mapCertificateTemplateRow(row);
}

// ─── Earned Certificates ──────────────────────────────────────────────────────

export interface CourseCertificateData {
  contentId: string;
  courseTitle: string;
  courseThumbnailUrl: string | null;
  recipientName: string;
  completedAt: string;
  template: CertificateTemplateRecord;
}

function mapCourseCertificateRow(row: Record<string, unknown>): CourseCertificateData {
  return {
    contentId: row.content_id as string,
    courseTitle: row.title as string,
    courseThumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    recipientName: row.display_name as string,
    completedAt: row.completed_at as string,
    template: {
      templateId: row.template_id as string,
      templateNumber: row.template_number as number,
      name: row.name as string,
      headlineText: row.headline_text as string,
      bodyText: row.body_text as string,
      organizationName: row.organization_name as string,
      signatoryName: row.signatory_name as string,
      signatoryTitle: row.signatory_title as string,
      logoUrl: (row.logo_url as string | null) ?? null,
      signatureUrl: (row.signature_url as string | null) ?? null,
      footerText: row.footer_text as string,
      accentColor: row.accent_color as string,
      isActive: row.is_active as boolean,
      createdAt: row.ct_created_at as string,
      updatedAt: row.ct_updated_at as string,
      elements: (row.elements as import('@/lib/certificate-elements').CertificateElement[] | null) ?? null,
    },
  };
}

const CERT_SELECT = `
  SELECT ci.content_id::text,
         ci.title,
         ci.thumbnail_url,
         cp.completed_at::text,
         u.display_name,
         ct.template_id::text, ct.template_number, ct.name, ct.headline_text, ct.body_text,
         ct.organization_name, ct.signatory_name, ct.signatory_title,
         ct.logo_url, ct.signature_url, ct.footer_text, ct.accent_color, ct.is_active,
         ct.elements,
         ct.created_at::text AS ct_created_at, ct.updated_at::text AS ct_updated_at
  FROM app_learning.content_items ci
  JOIN app_learning.content_progress cp ON cp.content_id = ci.content_id AND cp.user_id = $1::uuid
  JOIN app_learning.certificate_templates ct ON ct.template_id = ci.certificate_template_id
  JOIN app_core.users u ON u.user_id = $1::uuid
  WHERE cp.seen = true
    AND ci.certificate_template_id IS NOT NULL
`;

export async function getCourseCertificateData(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<CourseCertificateData> {
  await requireModulePermission(client, 'aprendizaje', 'view');

  const { rows } = await client.query(
    `${CERT_SELECT} AND ci.content_id = $2::uuid`,
    [actor.userId, contentId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Certificate not available: course not completed or no template assigned');
  }

  return mapCourseCertificateRow(row);
}

export async function listUserEarnedCertificates(
  client: PoolClient,
  actor: AuthUser,
): Promise<CourseCertificateData[]> {
  await requireModulePermission(client, 'aprendizaje', 'view');

  const { rows } = await client.query(
    `${CERT_SELECT} ORDER BY cp.completed_at DESC NULLS LAST`,
    [actor.userId],
  );

  return rows.map(mapCourseCertificateRow);
}
