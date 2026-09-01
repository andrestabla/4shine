import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';

/**
 * Gestión de la formación de Advisors.
 *
 * La pantalla anterior solo listaba `content_assignments`, así que se veía
 * vacía aunque hubiera cursos publicados y advisors avanzando en ellos: el
 * avance real no vive en la asignación sino en `content_progress`, y nunca
 * hubo forma de crear asignaciones desde la interfaz.
 *
 * Aquí la unidad de gestión es el par (advisor, curso): existe siempre, esté
 * asignado o no, con el avance real del advisor. Así el gestor ve de una vez
 * quién va al día, quién ni ha empezado y a quién todavía no le han asignado
 * el curso.
 */

export type TrainingStatus = 'not_started' | 'in_progress' | 'completed';

export interface MentorTrainingCourse {
  contentId: string;
  title: string;
  contentType: string;
  status: string;
  durationMinutes: number | null;
}

export interface MentorTrainingRow {
  /** Clave estable de la fila: par curso+persona. */
  rowKey: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  /** 'mentor' para advisors; otro rol si la persona avanzó sin ser advisor. */
  role: string;
  contentId: string;
  courseTitle: string;
  assigned: boolean;
  assignedAt: string | null;
  assignedByName: string | null;
  status: TrainingStatus;
  progressPercent: number;
  startedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}

export interface MentorTrainingStats {
  courses: number;
  advisors: number;
  assigned: number;
  inProgress: number;
  completed: number;
  notStarted: number;
}

export interface MentorTrainingOverview {
  courses: MentorTrainingCourse[];
  rows: MentorTrainingRow[];
  stats: MentorTrainingStats;
  /** true si se recortó el listado por tamaño (se informa, no se oculta). */
  truncated: boolean;
  generatedAt: string;
}

interface OverviewRow {
  user_id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  primary_role: string;
  content_id: string;
  title: string;
  assigned: boolean;
  assigned_at: string | null;
  assigned_by_name: string | null;
  progress_percent: string | null;
  started_at: string | null;
  last_viewed_at: string | null;
  completed_at: string | null;
}

const MAX_ROWS = 500;

function deriveStatus(progress: number, completedAt: string | null): TrainingStatus {
  if (completedAt || progress >= 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'not_started';
}

/**
 * Panorama completo: cursos del ámbito, y una fila por cada par advisor+curso.
 *
 * Incluye también a quien tenga avance sin ser advisor (por ejemplo un gestor
 * que hizo el curso de prueba): esconderlo haría que un dato real no cuadre
 * con lo que la persona ve en su propia pantalla.
 */
export async function getMentorTrainingOverview(
  client: PoolClient,
  actor: AuthUser,
  options?: { contentId?: string | null },
): Promise<MentorTrainingOverview> {
  await requireModulePermission(client, 'gestion_formacion_mentores', 'view');

  const { rows: courseRows } = await client.query<{
    content_id: string;
    title: string;
    content_type: string;
    status: string;
    duration_minutes: number | null;
  }>(
    `
      SELECT content_id::text, title, content_type, status, duration_minutes
      FROM app_learning.content_items
      WHERE scope = 'formacion_mentores'
        AND content_type <> 'assignment'
      ORDER BY title
    `,
  );

  const courses: MentorTrainingCourse[] = courseRows.map((row) => ({
    contentId: row.content_id,
    title: row.title,
    contentType: row.content_type,
    status: row.status,
    durationMinutes: row.duration_minutes,
  }));

  const contentFilter = options?.contentId?.trim() || null;

  const { rows } = await client.query<OverviewRow>(
    `
      WITH cursos AS (
        SELECT content_id, title
        FROM app_learning.content_items
        WHERE scope = 'formacion_mentores'
          AND content_type <> 'assignment'
          AND ($1::uuid IS NULL OR content_id = $1::uuid)
      ),
      -- Todo advisor activo cuenta para cada curso, aunque no tenga asignación
      -- ni avance: ese vacío es justo lo que el gestor necesita ver.
      pares AS (
        SELECT c.content_id, u.user_id
        FROM cursos c
        CROSS JOIN app_core.users u
        WHERE u.primary_role = 'mentor' AND u.is_active = true
        UNION
        SELECT ca.content_id, ca.assignee_user_id
        FROM app_learning.content_assignments ca
        JOIN cursos c ON c.content_id = ca.content_id
        UNION
        SELECT cp.content_id, cp.user_id
        FROM app_learning.content_progress cp
        JOIN cursos c ON c.content_id = cp.content_id
      )
      SELECT
        u.user_id::text,
        u.display_name,
        u.email::text,
        u.avatar_url,
        u.primary_role,
        c.content_id::text,
        c.title,
        (ca.assignment_id IS NOT NULL) AS assigned,
        ca.assigned_at::text,
        ab.display_name AS assigned_by_name,
        cp.progress_percent::text,
        cp.started_at::text,
        cp.last_viewed_at::text,
        cp.completed_at::text
      FROM pares p
      JOIN cursos c ON c.content_id = p.content_id
      JOIN app_core.users u ON u.user_id = p.user_id
      LEFT JOIN app_learning.content_assignments ca
        ON ca.content_id = p.content_id AND ca.assignee_user_id = p.user_id
      LEFT JOIN app_core.users ab ON ab.user_id = ca.assigned_by
      LEFT JOIN app_learning.content_progress cp
        ON cp.content_id = p.content_id AND cp.user_id = p.user_id
      WHERE u.is_active = true
      ORDER BY c.title, COALESCE(cp.progress_percent, 0) DESC, u.display_name
      LIMIT ${MAX_ROWS + 1}
    `,
    [contentFilter],
  );

  const truncated = rows.length > MAX_ROWS;
  const sliced = truncated ? rows.slice(0, MAX_ROWS) : rows;

  const mapped: MentorTrainingRow[] = sliced.map((row) => {
    const progress = Math.round(Number(row.progress_percent ?? 0));
    return {
      rowKey: `${row.content_id}:${row.user_id}`,
      userId: row.user_id,
      displayName: row.display_name,
      email: row.email,
      avatarUrl: row.avatar_url,
      role: row.primary_role,
      contentId: row.content_id,
      courseTitle: row.title,
      assigned: row.assigned,
      assignedAt: row.assigned_at,
      assignedByName: row.assigned_by_name,
      status: deriveStatus(progress, row.completed_at),
      progressPercent: progress,
      startedAt: row.started_at,
      lastViewedAt: row.last_viewed_at,
      completedAt: row.completed_at,
    };
  });

  const { rows: advisorCount } = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app_core.users WHERE primary_role = 'mentor' AND is_active = true`,
  );

  const stats: MentorTrainingStats = {
    courses: courses.length,
    advisors: Number(advisorCount[0]?.n ?? 0),
    assigned: mapped.filter((r) => r.assigned).length,
    inProgress: mapped.filter((r) => r.status === 'in_progress').length,
    completed: mapped.filter((r) => r.status === 'completed').length,
    notStarted: mapped.filter((r) => r.status === 'not_started').length,
  };

  return { courses, rows: mapped, stats, truncated, generatedAt: new Date().toISOString() };
}

export interface AssignCourseInput {
  contentId: string;
  userIds: string[];
}

export interface AssignCourseResult {
  assigned: number;
  alreadyAssigned: number;
}

/** Asigna un curso de formación a uno o varios advisors. */
export async function assignMentorCourse(
  client: PoolClient,
  actor: AuthUser,
  input: AssignCourseInput,
): Promise<AssignCourseResult> {
  await requireModulePermission(client, 'gestion_formacion_mentores', 'create');

  const contentId = input.contentId?.trim();
  if (!contentId) throw new Error('Selecciona el curso que quieres asignar.');
  const userIds = Array.from(new Set((input.userIds ?? []).map((id) => id.trim()).filter(Boolean)));
  if (userIds.length === 0) throw new Error('Selecciona al menos un advisor.');

  const { rows: courseRows } = await client.query<{ content_id: string }>(
    `SELECT content_id::text FROM app_learning.content_items
     WHERE content_id = $1::uuid AND scope = 'formacion_mentores'`,
    [contentId],
  );
  if (courseRows.length === 0) {
    throw new Error('El curso no existe o no pertenece a Formación Advisors.');
  }

  const { rows: before } = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app_learning.content_assignments
     WHERE content_id = $1::uuid AND assignee_user_id = ANY($2::uuid[])`,
    [contentId, userIds],
  );
  const already = Number(before[0]?.n ?? 0);

  // El estado inicial refleja el avance que la persona ya tenga: marcar
  // 'not_started' a quien va por la mitad sería reportar algo falso.
  const { rowCount } = await client.query(
    `
      INSERT INTO app_learning.content_assignments (
        content_id, assignee_user_id, assigned_by, status, progress_percent
      )
      SELECT
        $1::uuid,
        u.user_id,
        $3::uuid,
        CASE
          WHEN COALESCE(cp.progress_percent, 0) >= 100 OR cp.completed_at IS NOT NULL THEN 'completed'
          WHEN COALESCE(cp.progress_percent, 0) > 0 THEN 'in_progress'
          ELSE 'not_started'
        END,
        COALESCE(cp.progress_percent, 0)
      FROM app_core.users u
      LEFT JOIN app_learning.content_progress cp
        ON cp.content_id = $1::uuid AND cp.user_id = u.user_id
      WHERE u.user_id = ANY($2::uuid[]) AND u.is_active = true
      ON CONFLICT (content_id, assignee_user_id) DO NOTHING
    `,
    [contentId, userIds, actor.userId],
  );

  return { assigned: rowCount ?? 0, alreadyAssigned: already };
}

export interface UnassignCourseInput {
  contentId: string;
  userIds: string[];
}

/**
 * Quita la asignación. NO borra el avance del advisor: `content_progress` es
 * suyo y sobrevive a que el gestor se equivoque al asignar.
 */
export async function unassignMentorCourse(
  client: PoolClient,
  actor: AuthUser,
  input: UnassignCourseInput,
): Promise<{ removed: number }> {
  await requireModulePermission(client, 'gestion_formacion_mentores', 'delete');

  const contentId = input.contentId?.trim();
  const userIds = Array.from(new Set((input.userIds ?? []).map((id) => id.trim()).filter(Boolean)));
  if (!contentId || userIds.length === 0) {
    throw new Error('Indica el curso y al menos un advisor.');
  }

  const { rowCount } = await client.query(
    `DELETE FROM app_learning.content_assignments
     WHERE content_id = $1::uuid AND assignee_user_id = ANY($2::uuid[])`,
    [contentId, userIds],
  );

  return { removed: rowCount ?? 0 };
}
