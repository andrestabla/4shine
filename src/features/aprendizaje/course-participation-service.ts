/**
 * Reporte de participación en cursos (vista admin/gestor/adviser).
 *
 * Cuando un manager entra a un curso, ve además del temario un panel con:
 *   - Overview general (total usuarios accedidos, promedio de progreso,
 *     pendientes de revisión).
 *   - Tabla por usuario con estado de cada actividad y tarea del curso.
 *   - Para tareas: drawer de calificación inline reusando AssignmentReviewPanel.
 */

import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';

const MANAGE_ROLES = new Set(['admin', 'gestor', 'mentor']);

function assertCanManage(actor: AuthUser): void {
  if (!MANAGE_ROLES.has(actor.role)) {
    throw new Error('Solo Admin, Gestor o Adviser pueden ver reportes de cursos.');
  }
}

export interface CourseActivityRef {
  /** content_id del recurso del módulo que tiene linkedContentId apuntando a activity. */
  resourceContentId: string;
  resourceTitle: string;
  /** content_id del content de tipo activity (linkedContentId). */
  activityContentId: string;
  activityId: string;
  activityTitle: string;
  questionCount: number;
  passingScore: number;
}

export interface CourseTaskRef {
  resourceContentId: string;
  resourceTitle: string;
  /** content_id del content de tipo assignment (linkedContentId). */
  taskContentId: string;
  taskId: string;
  taskTitle: string;
  maxScore: number;
  passingScore: number;
}

export interface ParticipantSummary {
  userId: string;
  name: string;
  email: string;
  progressPercent: number;
  lastSeenAt: string | null;
  /** key = activityContentId */
  activityResults: Record<string, ActivityResultSummary>;
  /** key = taskContentId */
  taskResults: Record<string, TaskResultSummary>;
}

export interface ActivityResultSummary {
  attempts: number;
  bestScore: number | null;
  passed: boolean;
  lastAttemptAt: string | null;
}

export interface TaskResultSummary {
  status: 'none' | 'draft' | 'submitted' | 'graded' | 'rejected' | 'revision_requested';
  latestSubmissionId: string | null;
  score: number | null;
  passed: boolean | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface CourseParticipationReport {
  contentId: string;
  contentTitle: string;
  activities: CourseActivityRef[];
  tasks: CourseTaskRef[];
  participants: ParticipantSummary[];
  totals: {
    totalParticipants: number;
    averageProgress: number;
    pendingTaskReviews: number;
    activitiesPassedTotal: number;
    activitiesAttemptedTotal: number;
  };
}

interface CourseRow {
  content_id: string;
  title: string;
  structure_payload: { modules?: Array<{ resources?: Array<{ title?: string; contentType?: string; linkedContentId?: string }> }> } | null;
}

/**
 * Devuelve el reporte completo de participación de un curso para el admin.
 * Solo manager roles pueden invocar.
 */
export async function getCourseParticipationReport(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<CourseParticipationReport> {
  assertCanManage(actor);
  await requireModulePermission(client, 'aprendizaje', 'view');

  // 1. Leer el curso + extraer activity_ids y task_ids referenciados.
  const { rows: courseRows } = await client.query<CourseRow>(
    `SELECT content_id::text, title, structure_payload
     FROM app_learning.content_items
     WHERE content_id = $1::uuid`,
    [contentId],
  );
  const course = courseRows[0];
  if (!course) throw new Error('Curso no encontrado.');

  const linkedActivities: Array<{ resourceContentId: string; resourceTitle: string; activityContentId: string }> = [];
  const linkedTasks: Array<{ resourceContentId: string; resourceTitle: string; taskContentId: string }> = [];

  const modules = course.structure_payload?.modules ?? [];
  for (const mod of modules) {
    for (const res of mod.resources ?? []) {
      if (!res?.linkedContentId) continue;
      if (res.contentType === 'activity') {
        linkedActivities.push({
          resourceContentId: contentId,
          resourceTitle: res.title ?? 'Recurso',
          activityContentId: res.linkedContentId,
        });
      } else if (res.contentType === 'assignment') {
        linkedTasks.push({
          resourceContentId: contentId,
          resourceTitle: res.title ?? 'Recurso',
          taskContentId: res.linkedContentId,
        });
      }
    }
  }

  // 2. Cargar metadata de actividades y tareas referenciadas.
  const activityContentIds = linkedActivities.map((a) => a.activityContentId);
  const taskContentIds = linkedTasks.map((t) => t.taskContentId);

  const activities: CourseActivityRef[] = [];
  if (activityContentIds.length > 0) {
    const { rows } = await client.query<{
      activity_id: string;
      content_id: string;
      title: string;
      passing_score: number;
      question_count: number;
    }>(
      `SELECT
         ca.activity_id::text,
         ca.content_id::text,
         ca.title,
         ca.passing_score,
         (SELECT COUNT(*)::int FROM app_learning.activity_questions q WHERE q.activity_id = ca.activity_id) AS question_count
       FROM app_learning.content_activities ca
       WHERE ca.content_id = ANY($1::uuid[])`,
      [activityContentIds],
    );
    for (const a of linkedActivities) {
      const m = rows.find((r) => r.content_id === a.activityContentId);
      if (!m) continue;
      activities.push({
        ...a,
        activityId: m.activity_id,
        activityTitle: m.title,
        questionCount: m.question_count,
        passingScore: m.passing_score,
      });
    }
  }

  const tasks: CourseTaskRef[] = [];
  if (taskContentIds.length > 0) {
    const { rows } = await client.query<{
      task_id: string;
      content_id: string;
      title: string;
      max_score: number;
      passing_score: number;
    }>(
      `SELECT task_id::text, content_id::text, title, max_score, passing_score
       FROM app_learning.content_tasks
       WHERE content_id = ANY($1::uuid[])`,
      [taskContentIds],
    );
    for (const t of linkedTasks) {
      const m = rows.find((r) => r.content_id === t.taskContentId);
      if (!m) continue;
      tasks.push({
        ...t,
        taskId: m.task_id,
        taskTitle: m.title,
        maxScore: m.max_score,
        passingScore: m.passing_score,
      });
    }
  }

  // 3. Usuarios que han interactuado con el curso (content_progress) — base
  //    para la tabla del reporte.
  const { rows: progressRows } = await client.query<{
    user_id: string;
    name: string;
    email: string;
    progress_percent: number;
    updated_at: string | null;
  }>(
    `SELECT
       u.user_id::text,
       u.display_name AS name,
       u.email::text AS email,
       COALESCE(cp.progress_percent, 0)::float AS progress_percent,
       cp.updated_at::text
     FROM app_learning.content_progress cp
     JOIN app_core.users u ON u.user_id = cp.user_id
     WHERE cp.content_id = $1::uuid
     ORDER BY u.display_name`,
    [contentId],
  );

  // 4. Para cada actividad, cargar attempts agregados por usuario.
  const activityResults = new Map<string, Map<string, ActivityResultSummary>>(); // user_id -> activityContentId -> summary
  if (activities.length > 0) {
    const activityIds = activities.map((a) => a.activityId);
    const { rows: attempts } = await client.query<{
      user_id: string;
      activity_id: string;
      attempts: number;
      best_score: number | null;
      passed: boolean;
      last_attempt_at: string | null;
    }>(
      `SELECT
         user_id::text,
         activity_id::text,
         COUNT(*)::int FILTER (WHERE status = 'submitted') AS attempts,
         MAX(score_percent)::float AS best_score,
         BOOL_OR(passed) AS passed,
         MAX(COALESCE(submitted_at, started_at))::text AS last_attempt_at
       FROM app_learning.activity_attempts
       WHERE activity_id = ANY($1::uuid[])
       GROUP BY user_id, activity_id`,
      [activityIds],
    );
    for (const row of attempts) {
      const ref = activities.find((a) => a.activityId === row.activity_id);
      if (!ref) continue;
      if (!activityResults.has(row.user_id)) activityResults.set(row.user_id, new Map());
      activityResults.get(row.user_id)!.set(ref.activityContentId, {
        attempts: row.attempts,
        bestScore: row.best_score,
        passed: row.passed,
        lastAttemptAt: row.last_attempt_at,
      });
    }
  }

  // 5. Para cada tarea, cargar la entrega más reciente por usuario.
  const taskResults = new Map<string, Map<string, TaskResultSummary>>();
  if (tasks.length > 0) {
    const taskIds = tasks.map((t) => t.taskId);
    const { rows: submissions } = await client.query<{
      user_id: string;
      task_id: string;
      submission_id: string;
      status: TaskResultSummary['status'];
      score: number | null;
      passed: boolean | null;
      submitted_at: string | null;
      graded_at: string | null;
    }>(
      `SELECT DISTINCT ON (user_id, task_id)
         user_id::text,
         task_id::text,
         submission_id::text,
         status,
         score,
         passed,
         submitted_at::text,
         graded_at::text
       FROM app_learning.task_submissions
       WHERE task_id = ANY($1::uuid[])
       ORDER BY user_id, task_id, created_at DESC`,
      [taskIds],
    );
    for (const row of submissions) {
      const ref = tasks.find((t) => t.taskId === row.task_id);
      if (!ref) continue;
      if (!taskResults.has(row.user_id)) taskResults.set(row.user_id, new Map());
      taskResults.get(row.user_id)!.set(ref.taskContentId, {
        status: row.status,
        latestSubmissionId: row.submission_id,
        score: row.score,
        passed: row.passed,
        submittedAt: row.submitted_at,
        gradedAt: row.graded_at,
      });
    }
  }

  // 6. Componer participants. Incluimos usuarios que solo enviaron tareas o solo
  //    intentos de actividad aunque no estén en content_progress.
  const allUserIds = new Set<string>();
  for (const p of progressRows) allUserIds.add(p.user_id);
  for (const k of activityResults.keys()) allUserIds.add(k);
  for (const k of taskResults.keys()) allUserIds.add(k);

  // Si hay user_ids extra que no salieron en content_progress, los cargamos.
  const extraUserIds = Array.from(allUserIds).filter(
    (id) => !progressRows.some((p) => p.user_id === id),
  );
  const userById = new Map<string, { name: string; email: string }>();
  for (const p of progressRows) userById.set(p.user_id, { name: p.name, email: p.email });
  if (extraUserIds.length > 0) {
    const { rows } = await client.query<{ user_id: string; name: string; email: string }>(
      `SELECT user_id::text, display_name AS name, email::text AS email
       FROM app_core.users WHERE user_id = ANY($1::uuid[])`,
      [extraUserIds],
    );
    for (const r of rows) userById.set(r.user_id, { name: r.name, email: r.email });
  }

  const participants: ParticipantSummary[] = [];
  for (const userId of allUserIds) {
    const u = userById.get(userId);
    if (!u) continue;
    const progress = progressRows.find((p) => p.user_id === userId);
    participants.push({
      userId,
      name: u.name,
      email: u.email,
      progressPercent: progress?.progress_percent ?? 0,
      lastSeenAt: progress?.updated_at ?? null,
      activityResults: Object.fromEntries(activityResults.get(userId) ?? new Map()),
      taskResults: Object.fromEntries(taskResults.get(userId) ?? new Map()),
    });
  }
  participants.sort((a, b) => b.progressPercent - a.progressPercent || a.name.localeCompare(b.name));

  // 7. Totales.
  let activitiesPassedTotal = 0;
  let activitiesAttemptedTotal = 0;
  let pendingTaskReviews = 0;
  for (const p of participants) {
    for (const r of Object.values(p.activityResults)) {
      if (r.attempts > 0) activitiesAttemptedTotal += 1;
      if (r.passed) activitiesPassedTotal += 1;
    }
    for (const r of Object.values(p.taskResults)) {
      if (r.status === 'submitted' || r.status === 'revision_requested') {
        pendingTaskReviews += 1;
      }
    }
  }
  const totalParticipants = participants.length;
  const averageProgress =
    totalParticipants === 0
      ? 0
      : Math.round(
          participants.reduce((sum, p) => sum + p.progressPercent, 0) / totalParticipants,
        );

  return {
    contentId,
    contentTitle: course.title,
    activities,
    tasks,
    participants,
    totals: {
      totalParticipants,
      averageProgress,
      pendingTaskReviews,
      activitiesPassedTotal,
      activitiesAttemptedTotal,
    },
  };
}
