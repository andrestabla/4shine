import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type {
  AssignmentFile,
  AssignmentForLearner,
  AssignmentSummary,
  ContentAssignmentRecord,
  GradeSubmissionInput,
  SubmissionRecord,
  SubmissionStatus,
  SubmissionUserRecord,
  UpsertAssignmentInput,
  UpsertSubmissionInput,
} from './types';

const MANAGE_ROLES = new Set(['admin', 'gestor', 'mentor']);

function assertCanManage(actor: AuthUser): void {
  if (!MANAGE_ROLES.has(actor.role)) {
    throw new Error('Solo Admin, Gestor o Adviser pueden gestionar tareas.');
  }
}

/**
 * Las tareas solo se consumen dentro de un curso. Verifica que la tarea esté
 * vinculada como linkedContentId en al menos un curso publicado. Si no, el
 * líder no debería poder cargar la tarea ni enviar entregas.
 * Manager roles (admin/gestor/adviser) bypasan este check para QA.
 */
async function assertTaskAccessibleViaCourse(
  client: PoolClient,
  actor: AuthUser,
  taskContentId: string,
): Promise<void> {
  if (MANAGE_ROLES.has(actor.role)) return;
  const { rows } = await client.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM app_learning.content_items courses,
             LATERAL jsonb_array_elements(
               COALESCE(courses.structure_payload->'modules', '[]'::jsonb)
             ) AS mod,
             LATERAL jsonb_array_elements(
               COALESCE(mod->'resources', '[]'::jsonb)
             ) AS res
        WHERE courses.content_type = 'scorm'
          AND courses.status = 'published'
          AND (res->>'linkedContentId') = $1
      ) AS exists
    `,
    [taskContentId],
  );
  if (!rows[0]?.exists) {
    throw new Error(
      'Esta tarea no está disponible. Solo se puede acceder a tareas que forman parte de un curso publicado.',
    );
  }
}

interface AssignmentRow {
  task_id: string;
  content_id: string;
  title: string;
  instructions: string;
  evaluation_criteria: string;
  max_score: number;
  passing_score: number;
  accept_files: boolean;
  accept_url: boolean;
  accept_text: boolean;
  max_files: number;
  allow_multiple_submissions: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapAssignmentRow(row: AssignmentRow): ContentAssignmentRecord {
  return {
    assignmentId: row.task_id,
    contentId: row.content_id,
    title: row.title,
    instructions: row.instructions ?? '',
    evaluationCriteria: row.evaluation_criteria ?? '',
    maxScore: row.max_score,
    passingScore: row.passing_score,
    acceptFiles: row.accept_files,
    acceptUrl: row.accept_url,
    acceptText: row.accept_text,
    maxFiles: row.max_files,
    allowMultipleSubmissions: row.allow_multiple_submissions,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface SubmissionRow {
  submission_id: string;
  task_id: string;
  user_id: string;
  status: SubmissionStatus;
  submission_text: string | null;
  submission_url: string | null;
  submission_files: unknown;
  score: number | null;
  passed: boolean | null;
  grader_feedback: string | null;
  grader_id: string | null;
  grader_name: string | null;
  graded_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

function safeFiles(value: unknown): AssignmentFile[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is { url?: unknown; name?: unknown; size?: unknown } =>
      Boolean(x) && typeof x === 'object',
    )
    .map((x) => ({
      url: typeof x.url === 'string' ? x.url : '',
      name: typeof x.name === 'string' ? x.name : 'archivo',
      size: typeof x.size === 'number' ? x.size : null,
    }))
    .filter((x) => x.url.length > 0);
}

function mapSubmissionRow(row: SubmissionRow): SubmissionRecord {
  return {
    submissionId: row.submission_id,
    assignmentId: row.task_id,
    userId: row.user_id,
    status: row.status,
    submissionText: row.submission_text,
    submissionUrl: row.submission_url,
    submissionFiles: safeFiles(row.submission_files),
    score: row.score,
    passed: row.passed,
    graderFeedback: row.grader_feedback,
    graderName: row.grader_name,
    graderId: row.grader_id,
    gradedAt: row.graded_at,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── CRUD assignment (admin/gestor/adviser) ──────────────────────────────────

export async function upsertAssignment(
  client: PoolClient,
  actor: AuthUser,
  input: UpsertAssignmentInput,
): Promise<ContentAssignmentRecord> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'update');

  const { rows: contentRows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM app_learning.content_items WHERE content_id = $1::uuid) AS exists`,
    [input.contentId],
  );
  if (!contentRows[0]?.exists) throw new Error('Contenido no encontrado.');

  const passingScore = Math.max(0, Math.round(input.passingScore ?? 70));
  const maxScore = Math.max(1, Math.round(input.maxScore ?? 100));
  const maxFiles = Math.max(0, Math.min(20, Math.round(input.maxFiles ?? 5)));

  const { rows } = await client.query<AssignmentRow>(
    `
      INSERT INTO app_learning.content_tasks (
        content_id, title, instructions, evaluation_criteria,
        max_score, passing_score, accept_files, accept_url, accept_text,
        max_files, allow_multiple_submissions, is_active, created_by
      )
      VALUES (
        $1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::uuid
      )
      ON CONFLICT (content_id) DO UPDATE SET
        title = EXCLUDED.title,
        instructions = EXCLUDED.instructions,
        evaluation_criteria = EXCLUDED.evaluation_criteria,
        max_score = EXCLUDED.max_score,
        passing_score = EXCLUDED.passing_score,
        accept_files = EXCLUDED.accept_files,
        accept_url = EXCLUDED.accept_url,
        accept_text = EXCLUDED.accept_text,
        max_files = EXCLUDED.max_files,
        allow_multiple_submissions = EXCLUDED.allow_multiple_submissions,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING
        task_id::text, content_id::text, title, instructions, evaluation_criteria,
        max_score, passing_score, accept_files, accept_url, accept_text,
        max_files, allow_multiple_submissions, is_active,
        created_at::text, updated_at::text
    `,
    [
      input.contentId,
      input.title.trim(),
      input.instructions ?? '',
      input.evaluationCriteria ?? '',
      maxScore,
      passingScore,
      input.acceptFiles ?? true,
      input.acceptUrl ?? true,
      input.acceptText ?? true,
      maxFiles,
      input.allowMultipleSubmissions ?? true,
      input.isActive ?? true,
      actor.userId,
    ],
  );
  return mapAssignmentRow(rows[0]);
}

export async function getAssignmentForContent(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<ContentAssignmentRecord | null> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'view');
  const { rows } = await client.query<AssignmentRow>(
    `
      SELECT
        task_id::text, content_id::text, title, instructions, evaluation_criteria,
        max_score, passing_score, accept_files, accept_url, accept_text,
        max_files, allow_multiple_submissions, is_active,
        created_at::text, updated_at::text
      FROM app_learning.content_tasks
      WHERE content_id = $1::uuid
      LIMIT 1
    `,
    [contentId],
  );
  return rows[0] ? mapAssignmentRow(rows[0]) : null;
}

export async function deleteAssignment(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<void> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'delete');
  await client.query(
    `DELETE FROM app_learning.content_tasks WHERE content_id = $1::uuid`,
    [contentId],
  );
}

// ─── Vista del líder ─────────────────────────────────────────────────────────

export async function getAssignmentForLearner(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<AssignmentForLearner | null> {
  await requireModulePermission(client, 'aprendizaje', 'view');
  // Solo accesible si la tarea está vinculada a un curso publicado.
  await assertTaskAccessibleViaCourse(client, actor, contentId);
  const { rows } = await client.query<AssignmentRow>(
    `
      SELECT
        task_id::text, content_id::text, title, instructions, evaluation_criteria,
        max_score, passing_score, accept_files, accept_url, accept_text,
        max_files, allow_multiple_submissions, is_active,
        created_at::text, updated_at::text
      FROM app_learning.content_tasks
      WHERE content_id = $1::uuid AND is_active = true
      LIMIT 1
    `,
    [contentId],
  );
  if (!rows[0]) return null;
  const assignment = mapAssignmentRow(rows[0]);
  const mySubmissions = await listSubmissionsForUser(client, assignment.assignmentId, actor.userId);
  return { ...assignment, mySubmissions };
}

async function listSubmissionsForUser(
  client: PoolClient,
  assignmentId: string,
  userId: string,
): Promise<SubmissionRecord[]> {
  const { rows } = await client.query<SubmissionRow>(
    `
      SELECT
        s.submission_id::text, s.task_id::text, s.user_id::text, s.status,
        s.submission_text, s.submission_url, s.submission_files,
        s.score, s.passed, s.grader_feedback,
        s.graded_by::text AS grader_id,
        gu.display_name AS grader_name,
        s.graded_at::text, s.submitted_at::text,
        s.created_at::text, s.updated_at::text
      FROM app_learning.task_submissions s
      LEFT JOIN app_core.users gu ON gu.user_id = s.graded_by
      WHERE s.task_id = $1::uuid AND s.user_id = $2::uuid
      ORDER BY s.created_at DESC
      LIMIT 50
    `,
    [assignmentId, userId],
  );
  return rows.map(mapSubmissionRow);
}

// ─── Submit (líder) ─────────────────────────────────────────────────────────

export async function upsertMySubmission(
  client: PoolClient,
  actor: AuthUser,
  assignmentId: string,
  input: UpsertSubmissionInput,
): Promise<SubmissionRecord> {
  await requireModulePermission(client, 'aprendizaje', 'update');

  const { rows: assignmentRows } = await client.query<{
    content_id: string;
    is_active: boolean;
    accept_files: boolean;
    accept_url: boolean;
    accept_text: boolean;
    max_files: number;
    allow_multiple_submissions: boolean;
  }>(
    `
      SELECT content_id::text, is_active, accept_files, accept_url, accept_text, max_files, allow_multiple_submissions
      FROM app_learning.content_tasks
      WHERE task_id = $1::uuid
    `,
    [assignmentId],
  );
  const a = assignmentRows[0];
  if (!a || !a.is_active) throw new Error('Tarea no disponible.');
  // Solo permitir enviar entregas si la tarea está vinculada a un curso publicado.
  await assertTaskAccessibleViaCourse(client, actor, a.content_id);

  const files = Array.isArray(input.submissionFiles)
    ? input.submissionFiles.slice(0, a.max_files).filter((f) => f && typeof f.url === 'string' && f.url.length > 0)
    : [];
  const url = a.accept_url ? input.submissionUrl?.trim() || null : null;
  const text = a.accept_text ? input.submissionText?.trim() || null : null;
  const filesValue = a.accept_files ? files : [];

  // Reusar el draft existente si lo hay; si no, crear nuevo.
  const { rows: existingRows } = await client.query<{ submission_id: string; status: SubmissionStatus }>(
    `
      SELECT submission_id::text, status
      FROM app_learning.task_submissions
      WHERE task_id = $1::uuid AND user_id = $2::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [assignmentId, actor.userId],
  );
  const existing = existingRows[0];
  const shouldSubmit = Boolean(input.submit);

  let submissionId: string;
  if (existing && (existing.status === 'draft' || existing.status === 'revision_requested')) {
    submissionId = existing.submission_id;
    await client.query(
      `
        UPDATE app_learning.task_submissions
        SET
          submission_text = $2,
          submission_url = $3,
          submission_files = $4::jsonb,
          status = CASE WHEN $5::boolean THEN 'submitted' ELSE status END,
          submitted_at = CASE WHEN $5::boolean THEN now() ELSE submitted_at END,
          updated_at = now()
        WHERE submission_id = $1::uuid
      `,
      [submissionId, text, url, JSON.stringify(filesValue), shouldSubmit],
    );
  } else {
    if (!a.allow_multiple_submissions && existing && existing.status !== 'draft') {
      throw new Error('Esta tarea solo permite una entrega.');
    }
    const { rows } = await client.query<{ submission_id: string }>(
      `
        INSERT INTO app_learning.task_submissions (
          task_id, user_id, status, submission_text, submission_url, submission_files,
          submitted_at
        )
        VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, $7::timestamptz)
        RETURNING submission_id::text
      `,
      [
        assignmentId,
        actor.userId,
        shouldSubmit ? 'submitted' : 'draft',
        text,
        url,
        JSON.stringify(filesValue),
        shouldSubmit ? new Date().toISOString() : null,
      ],
    );
    submissionId = rows[0].submission_id;
  }

  const fresh = await listSubmissionsForUser(client, assignmentId, actor.userId);
  return fresh.find((s) => s.submissionId === submissionId) ?? fresh[0];
}

// ─── Grade (admin/gestor/adviser) ────────────────────────────────────────────

export async function gradeSubmission(
  client: PoolClient,
  actor: AuthUser,
  submissionId: string,
  input: GradeSubmissionInput,
): Promise<SubmissionRecord> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'update');

  const { rows: subRows } = await client.query<{ task_id: string }>(
    `SELECT task_id::text FROM app_learning.task_submissions WHERE submission_id = $1::uuid`,
    [submissionId],
  );
  const sub = subRows[0];
  if (!sub) throw new Error('Entrega no encontrada.');

  const { rows: assignmentRows } = await client.query<{ max_score: number; passing_score: number }>(
    `SELECT max_score, passing_score FROM app_learning.content_tasks WHERE task_id = $1::uuid`,
    [sub.task_id],
  );
  const a = assignmentRows[0];
  if (!a) throw new Error('Tarea no encontrada.');

  const score = Math.max(0, Math.min(a.max_score, Math.round(input.score)));
  const passed = input.passed ?? score >= a.passing_score;
  const nextStatus = input.status ?? 'graded';

  await client.query(
    `
      UPDATE app_learning.task_submissions
      SET
        score = $2,
        passed = $3,
        status = $4,
        grader_feedback = $5,
        graded_by = $6::uuid,
        graded_at = now(),
        updated_at = now()
      WHERE submission_id = $1::uuid
    `,
    [submissionId, score, passed, nextStatus, input.graderFeedback ?? null, actor.userId],
  );

  const { rows } = await client.query<SubmissionRow & { user_id: string }>(
    `
      SELECT
        s.submission_id::text, s.task_id::text, s.user_id::text, s.status,
        s.submission_text, s.submission_url, s.submission_files,
        s.score, s.passed, s.grader_feedback,
        s.graded_by::text AS grader_id,
        gu.display_name AS grader_name,
        s.graded_at::text, s.submitted_at::text,
        s.created_at::text, s.updated_at::text
      FROM app_learning.task_submissions s
      LEFT JOIN app_core.users gu ON gu.user_id = s.graded_by
      WHERE s.submission_id = $1::uuid
    `,
    [submissionId],
  );
  return mapSubmissionRow(rows[0]);
}

// ─── List (admin/gestor/adviser) ─────────────────────────────────────────────

export async function listSubmissionsForAssignment(
  client: PoolClient,
  actor: AuthUser,
  assignmentId: string,
): Promise<SubmissionUserRecord[]> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'view');
  const { rows } = await client.query<SubmissionRow & { user_name: string; user_email: string }>(
    `
      SELECT
        s.submission_id::text, s.task_id::text, s.user_id::text, s.status,
        s.submission_text, s.submission_url, s.submission_files,
        s.score, s.passed, s.grader_feedback,
        s.graded_by::text AS grader_id,
        gu.display_name AS grader_name,
        s.graded_at::text, s.submitted_at::text,
        s.created_at::text, s.updated_at::text,
        u.display_name AS user_name,
        u.email::text AS user_email
      FROM app_learning.task_submissions s
      JOIN app_core.users u ON u.user_id = s.user_id
      LEFT JOIN app_core.users gu ON gu.user_id = s.graded_by
      WHERE s.task_id = $1::uuid
      ORDER BY
        CASE s.status WHEN 'submitted' THEN 0 WHEN 'revision_requested' THEN 1 ELSE 2 END,
        s.submitted_at DESC NULLS LAST
      LIMIT 500
    `,
    [assignmentId],
  );
  return rows.map((row) => ({
    ...mapSubmissionRow(row),
    userName: row.user_name,
    userEmail: row.user_email,
  }));
}

export interface AvailableAssignmentRecord {
  contentId: string;
  contentTitle: string;
  assignmentTitle: string;
  isActive: boolean;
}

export async function listAvailableAssignments(
  client: PoolClient,
  actor: AuthUser,
): Promise<AvailableAssignmentRecord[]> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'view');
  const { rows } = await client.query<{
    content_id: string;
    content_title: string;
    assignment_title: string;
    is_active: boolean;
  }>(
    `
      SELECT
        ci.content_id::text,
        ci.title AS content_title,
        ca.title AS assignment_title,
        ca.is_active
      FROM app_learning.content_tasks ca
      JOIN app_learning.content_items ci ON ci.content_id = ca.content_id
      ORDER BY ci.title
      LIMIT 500
    `,
  );
  return rows.map((r) => ({
    contentId: r.content_id,
    contentTitle: r.content_title,
    assignmentTitle: r.assignment_title,
    isActive: r.is_active,
  }));
}

// Marcador para AssignmentSummary (no usado todavía pero exportado por completitud)
export const __AssignmentSummaryShape: AssignmentSummary | null = null;
