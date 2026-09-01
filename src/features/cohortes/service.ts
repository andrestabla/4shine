import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';

/**
 * Cohortes: agrupamiento de líderes dentro de la organización.
 *
 * A diferencia de la organización —que es la frontera del sistema— la cohorte
 * es un corte interno: sirve para personalizar a qué accede un grupo y para
 * leer su avance junto, sin tener que ir usuario por usuario.
 *
 * Los accesos de la cohorte se aplican ENTRE el plan y los ajustes
 * individuales: el plan pone la base, la cohorte la corrige para el grupo, y
 * el ajuste de una persona gana sobre ambos (ver features/access/service.ts).
 */

export type CohortStatus = 'planned' | 'active' | 'completed' | 'archived';

export interface CohortRecord {
  cohortId: string;
  cohortCode: string;
  name: string;
  description: string | null;
  status: CohortStatus;
  startsAt: string | null;
  endsAt: string | null;
  memberCount: number;
  createdAt: string;
}

export interface CohortMemberRecord {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  planName: string | null;
  joinedAt: string;
  /** Avance del diagnóstico: null si nunca lo inició. */
  discoveryPercent: number | null;
  discoveryStatus: string | null;
  /** Workbooks con algo escrito y promedio de avance. */
  workbooksStarted: number;
  workbooksAvgPercent: number;
  /** Sesiones 1:1 agendadas y completadas. */
  sessionsScheduled: number;
  sessionsCompleted: number;
}

export interface CohortReport {
  members: number;
  discoveryStarted: number;
  discoveryCompleted: number;
  workbooksAvgPercent: number;
  sessionsScheduled: number;
  sessionsCompleted: number;
}

export interface CohortDetail {
  cohort: CohortRecord;
  members: CohortMemberRecord[];
  report: CohortReport;
  /** module_code o clave de sección → encendido/apagado. */
  moduleAccess: Record<string, boolean>;
}

const STATUSES = new Set<CohortStatus>(['planned', 'active', 'completed', 'archived']);

/** La organización de quien opera; hoy todas las cohortes son de Algoritmo T's. */
async function resolveOrganizationId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1::uuid`,
    [userId],
  );
  const orgId = rows[0]?.organization_id;
  if (!orgId) throw new Error('El usuario no pertenece a una organización.');
  return orgId;
}

function normalizeCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function listCohorts(client: PoolClient, actor: AuthUser): Promise<CohortRecord[]> {
  await requireModulePermission(client, 'cohortes', 'view');
  const organizationId = await resolveOrganizationId(client, actor.userId);

  const { rows } = await client.query<{
    cohort_id: string;
    cohort_code: string;
    name: string;
    description: string | null;
    status: CohortStatus;
    starts_at: string | null;
    ends_at: string | null;
    member_count: number;
    created_at: string;
  }>(
    `
      SELECT
        c.cohort_id::text,
        c.cohort_code,
        c.name,
        c.description,
        c.status,
        c.starts_at::text,
        c.ends_at::text,
        (
          SELECT COUNT(*)::int
          FROM app_core.cohort_memberships m
          WHERE m.cohort_id = c.cohort_id AND m.left_at IS NULL
        ) AS member_count,
        c.created_at::text
      FROM app_core.cohorts c
      WHERE c.organization_id = $1::uuid
      ORDER BY
        CASE c.status WHEN 'active' THEN 0 WHEN 'planned' THEN 1 WHEN 'completed' THEN 2 ELSE 3 END,
        c.starts_at DESC NULLS LAST,
        c.name
    `,
    [organizationId],
  );

  return rows.map((row) => ({
    cohortId: row.cohort_id,
    cohortCode: row.cohort_code,
    name: row.name,
    description: row.description,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    memberCount: Number(row.member_count ?? 0),
    createdAt: row.created_at,
  }));
}

export interface CreateCohortInput {
  name: string;
  cohortCode?: string | null;
  description?: string | null;
  status?: CohortStatus;
  startsAt?: string | null;
  endsAt?: string | null;
}

export async function createCohort(
  client: PoolClient,
  actor: AuthUser,
  input: CreateCohortInput,
): Promise<CohortRecord> {
  await requireModulePermission(client, 'cohortes', 'create');
  const organizationId = await resolveOrganizationId(client, actor.userId);

  const name = input.name?.trim();
  if (!name || name.length < 3) throw new Error('El nombre de la cohorte es obligatorio.');

  const code = normalizeCode(input.cohortCode?.trim() || name);
  if (!code) throw new Error('No se pudo generar un código para la cohorte.');

  const status = input.status && STATUSES.has(input.status) ? input.status : 'planned';
  if (input.startsAt && input.endsAt && input.endsAt < input.startsAt) {
    throw new Error('La fecha de fin no puede ser anterior a la de inicio.');
  }

  const { rows: existing } = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app_core.cohorts WHERE cohort_code = $1`,
    [code],
  );
  if (Number(existing[0]?.n ?? 0) > 0) {
    throw new Error(`Ya existe una cohorte con el código "${code}".`);
  }

  const { rows } = await client.query<{ cohort_id: string }>(
    `
      INSERT INTO app_core.cohorts
        (organization_id, cohort_code, name, description, status, starts_at, ends_at, created_by)
      VALUES ($1::uuid, $2, $3, $4, $5, $6::date, $7::date, $8::uuid)
      RETURNING cohort_id::text
    `,
    [
      organizationId,
      code,
      name,
      input.description?.trim() || null,
      status,
      input.startsAt || null,
      input.endsAt || null,
      actor.userId,
    ],
  );

  const created = (await listCohorts(client, actor)).find((c) => c.cohortId === rows[0].cohort_id);
  if (!created) throw new Error('No se pudo crear la cohorte.');
  return created;
}

export interface UpdateCohortInput {
  name?: string;
  description?: string | null;
  status?: CohortStatus;
  startsAt?: string | null;
  endsAt?: string | null;
}

export async function updateCohort(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
  input: UpdateCohortInput,
): Promise<CohortRecord> {
  await requireModulePermission(client, 'cohortes', 'update');
  await assertCohortInOrg(client, actor, cohortId);

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 3) throw new Error('El nombre de la cohorte es obligatorio.');
    sets.push(`name = $${i++}`);
    values.push(name);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${i++}`);
    values.push(input.description?.trim() || null);
  }
  if (input.status !== undefined) {
    if (!STATUSES.has(input.status)) throw new Error('Estado de cohorte no válido.');
    sets.push(`status = $${i++}`);
    values.push(input.status);
  }
  if (input.startsAt !== undefined) {
    sets.push(`starts_at = $${i++}::date`);
    values.push(input.startsAt || null);
  }
  if (input.endsAt !== undefined) {
    sets.push(`ends_at = $${i++}::date`);
    values.push(input.endsAt || null);
  }

  if (sets.length === 0) throw new Error('No hay cambios para guardar.');
  sets.push('updated_at = now()');
  values.push(cohortId);

  await client.query(
    `UPDATE app_core.cohorts SET ${sets.join(', ')} WHERE cohort_id = $${i}::uuid`,
    values,
  );

  const updated = (await listCohorts(client, actor)).find((c) => c.cohortId === cohortId);
  if (!updated) throw new Error('Cohorte no encontrada.');
  return updated;
}

/**
 * Borra la cohorte. Las membresías y los accesos caen con ella (CASCADE); las
 * personas y su avance no se tocan: la cohorte es una etiqueta, no el dueño de
 * los datos.
 */
export async function deleteCohort(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
): Promise<{ cohortId: string }> {
  await requireModulePermission(client, 'cohortes', 'delete');
  await assertCohortInOrg(client, actor, cohortId);
  await client.query(`DELETE FROM app_core.cohorts WHERE cohort_id = $1::uuid`, [cohortId]);
  return { cohortId };
}

async function assertCohortInOrg(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
): Promise<string> {
  const organizationId = await resolveOrganizationId(client, actor.userId);
  const { rows } = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app_core.cohorts
     WHERE cohort_id = $1::uuid AND organization_id = $2::uuid`,
    [cohortId, organizationId],
  );
  if (Number(rows[0]?.n ?? 0) === 0) throw new Error('Cohorte no encontrada.');
  return organizationId;
}

export async function getCohortDetail(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
): Promise<CohortDetail> {
  await requireModulePermission(client, 'cohortes', 'view');
  await assertCohortInOrg(client, actor, cohortId);

  const cohort = (await listCohorts(client, actor)).find((c) => c.cohortId === cohortId);
  if (!cohort) throw new Error('Cohorte no encontrada.');

  const { rows } = await client.query<{
    user_id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
    primary_role: string;
    plan_name: string | null;
    joined_at: string;
    discovery_percent: string | null;
    discovery_status: string | null;
    workbooks_started: number;
    workbooks_avg: string | null;
    sessions_scheduled: number;
    sessions_completed: number;
  }>(
    `
      SELECT
        u.user_id::text,
        u.display_name,
        u.email::text,
        u.avatar_url,
        u.primary_role,
        sp.name AS plan_name,
        m.joined_at::text,
        d.completion_percent::text AS discovery_percent,
        d.status AS discovery_status,
        COALESCE(w.started, 0)::int AS workbooks_started,
        w.avg_percent::text AS workbooks_avg,
        COALESCE(s.scheduled, 0)::int AS sessions_scheduled,
        COALESCE(s.completed, 0)::int AS sessions_completed
      FROM app_core.cohort_memberships m
      JOIN app_core.users u ON u.user_id = m.user_id
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      LEFT JOIN app_billing.subscription_plans sp ON sp.plan_id = up.subscription_plan_id
      LEFT JOIN LATERAL (
        SELECT ds.completion_percent, ds.status
        FROM app_assessment.discovery_sessions ds
        WHERE ds.user_id = u.user_id
        ORDER BY ds.created_at DESC
        LIMIT 1
      ) d ON true
      LEFT JOIN LATERAL (
        -- "Iniciado" = tiene avance o respuestas guardadas: a todo líder se le
        -- siembran los 10 workbooks vacíos, así que contarlos sin más mentiría.
        SELECT
          COUNT(*) FILTER (
            WHERE COALESCE(uw.completion_percent, 0) > 0
               OR uw.state_payload <> '{}'::jsonb
          ) AS started,
          AVG(COALESCE(uw.completion_percent, 0)) AS avg_percent
        FROM app_learning.user_workbooks uw
        WHERE uw.owner_user_id = u.user_id
      ) w ON true
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS scheduled,
          COUNT(*) FILTER (WHERE ms.status = 'completed') AS completed
        FROM app_mentoring.mentorship_sessions ms
        JOIN app_mentoring.session_participants sp2 ON sp2.session_id = ms.session_id
        WHERE sp2.user_id = u.user_id
      ) s ON true
      WHERE m.cohort_id = $1::uuid AND m.left_at IS NULL
      ORDER BY u.display_name
    `,
    [cohortId],
  );

  const members: CohortMemberRecord[] = rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    role: row.primary_role,
    planName: row.plan_name,
    joinedAt: row.joined_at,
    discoveryPercent: row.discovery_percent === null ? null : Math.round(Number(row.discovery_percent)),
    discoveryStatus: row.discovery_status,
    workbooksStarted: Number(row.workbooks_started ?? 0),
    workbooksAvgPercent: Math.round(Number(row.workbooks_avg ?? 0)),
    sessionsScheduled: Number(row.sessions_scheduled ?? 0),
    sessionsCompleted: Number(row.sessions_completed ?? 0),
  }));

  const report: CohortReport = {
    members: members.length,
    discoveryStarted: members.filter((m) => m.discoveryPercent !== null).length,
    discoveryCompleted: members.filter((m) => m.discoveryStatus === 'results').length,
    workbooksAvgPercent: members.length
      ? Math.round(members.reduce((sum, m) => sum + m.workbooksAvgPercent, 0) / members.length)
      : 0,
    sessionsScheduled: members.reduce((sum, m) => sum + m.sessionsScheduled, 0),
    sessionsCompleted: members.reduce((sum, m) => sum + m.sessionsCompleted, 0),
  };

  const moduleAccess = await readCohortModuleAccess(client, cohortId);

  return { cohort, members, report, moduleAccess: Object.fromEntries(moduleAccess) };
}

/** Accesos de la cohorte. Exportado también para el cálculo de acceso del visor. */
export async function readCohortModuleAccess(
  client: PoolClient,
  cohortId: string,
): Promise<Map<string, boolean>> {
  const { rows } = await client.query<{ module_code: string; is_enabled: boolean }>(
    `SELECT module_code, is_enabled FROM app_auth.cohort_module_access WHERE cohort_id = $1::uuid`,
    [cohortId],
  );
  return new Map(rows.map((row) => [row.module_code, !!row.is_enabled]));
}

export interface SetCohortAccessInput {
  moduleCode: string;
  /** null borra el ajuste y devuelve el módulo al comportamiento del plan. */
  isEnabled: boolean | null;
}

export async function setCohortModuleAccess(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
  input: SetCohortAccessInput,
): Promise<Record<string, boolean>> {
  await requireModulePermission(client, 'cohortes', 'update');
  await assertCohortInOrg(client, actor, cohortId);

  const moduleCode = input.moduleCode?.trim();
  if (!moduleCode) throw new Error('Indica el módulo a configurar.');

  if (input.isEnabled === null) {
    await client.query(
      `DELETE FROM app_auth.cohort_module_access WHERE cohort_id = $1::uuid AND module_code = $2`,
      [cohortId, moduleCode],
    );
  } else {
    await client.query(
      `
        INSERT INTO app_auth.cohort_module_access (cohort_id, module_code, is_enabled, updated_by)
        VALUES ($1::uuid, $2, $3, $4::uuid)
        ON CONFLICT (cohort_id, module_code) DO UPDATE
        SET is_enabled = EXCLUDED.is_enabled,
            updated_by = EXCLUDED.updated_by,
            updated_at = now()
      `,
      [cohortId, moduleCode, input.isEnabled, actor.userId],
    );
  }

  return Object.fromEntries(await readCohortModuleAccess(client, cohortId));
}

export interface CohortMembershipInput {
  userIds: string[];
}

export async function addCohortMembers(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
  input: CohortMembershipInput,
): Promise<{ added: number }> {
  await requireModulePermission(client, 'cohortes', 'update');
  const organizationId = await assertCohortInOrg(client, actor, cohortId);

  const userIds = Array.from(new Set((input.userIds ?? []).map((id) => id.trim()).filter(Boolean)));
  if (userIds.length === 0) throw new Error('Selecciona al menos una persona.');

  // Reincorporar a quien había salido antes: si vuelve, se limpia su left_at
  // en vez de dejar la membresía cerrada y crear confusión.
  const { rowCount } = await client.query(
    `
      INSERT INTO app_core.cohort_memberships (cohort_id, user_id, role_code)
      SELECT $1::uuid, u.user_id, u.primary_role
      FROM app_core.users u
      WHERE u.user_id = ANY($2::uuid[])
        AND u.is_active = true
        AND u.organization_id = $3::uuid
      ON CONFLICT (cohort_id, user_id) DO UPDATE
      SET left_at = NULL, role_code = EXCLUDED.role_code
    `,
    [cohortId, userIds, organizationId],
  );

  return { added: rowCount ?? 0 };
}

/**
 * Saca a alguien de la cohorte marcando su salida en vez de borrar la fila:
 * así queda registro de que estuvo, que es lo que permite leer después la
 * historia de un programa.
 */
export async function removeCohortMembers(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
  input: CohortMembershipInput,
): Promise<{ removed: number }> {
  await requireModulePermission(client, 'cohortes', 'update');
  await assertCohortInOrg(client, actor, cohortId);

  const userIds = Array.from(new Set((input.userIds ?? []).map((id) => id.trim()).filter(Boolean)));
  if (userIds.length === 0) throw new Error('Selecciona al menos una persona.');

  const { rowCount } = await client.query(
    `
      UPDATE app_core.cohort_memberships
      SET left_at = now()
      WHERE cohort_id = $1::uuid AND user_id = ANY($2::uuid[]) AND left_at IS NULL
    `,
    [cohortId, userIds],
  );

  return { removed: rowCount ?? 0 };
}

export interface AssignableUser {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  planName: string | null;
  /** Cohortes activas a las que ya pertenece, para no duplicar sin saberlo. */
  cohorts: string[];
}

/** Personas de la organización que se pueden sumar a la cohorte. */
export async function listAssignableUsers(
  client: PoolClient,
  actor: AuthUser,
  cohortId: string,
): Promise<AssignableUser[]> {
  await requireModulePermission(client, 'cohortes', 'view');
  const organizationId = await assertCohortInOrg(client, actor, cohortId);

  const { rows } = await client.query<{
    user_id: string;
    display_name: string;
    email: string;
    primary_role: string;
    plan_name: string | null;
    cohorts: string[] | null;
  }>(
    `
      SELECT
        u.user_id::text,
        u.display_name,
        u.email::text,
        u.primary_role,
        sp.name AS plan_name,
        ARRAY(
          SELECT c2.name
          FROM app_core.cohort_memberships m2
          JOIN app_core.cohorts c2 ON c2.cohort_id = m2.cohort_id
          WHERE m2.user_id = u.user_id AND m2.left_at IS NULL
          ORDER BY c2.name
        ) AS cohorts
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      LEFT JOIN app_billing.subscription_plans sp ON sp.plan_id = up.subscription_plan_id
      WHERE u.is_active = true
        AND u.organization_id = $2::uuid
        AND u.primary_role IN ('lider', 'invitado')
        AND NOT EXISTS (
          SELECT 1 FROM app_core.cohort_memberships m
          WHERE m.cohort_id = $1::uuid AND m.user_id = u.user_id AND m.left_at IS NULL
        )
      ORDER BY u.display_name
      LIMIT 500
    `,
    [cohortId, organizationId],
  );

  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    role: row.primary_role,
    planName: row.plan_name,
    cohorts: row.cohorts ?? [],
  }));
}

// ── Cursos restringidos a cohortes ──────────────────────────────────────────

/** allow = solo esa cohorte lo ve; deny = esa cohorte no lo ve. */
export type ContentCohortMode = 'allow' | 'deny';

export interface ContentCohortAssignment {
  cohortId: string;
  name: string;
  status: CohortStatus;
  mode: ContentCohortMode;
}

/** Cohortes a las que está restringido un contenido. Vacío = visible según el plan. */
export async function getContentCohorts(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
): Promise<ContentCohortAssignment[]> {
  await requireModulePermission(client, 'cohortes', 'view');
  const { rows } = await client.query<{
    cohort_id: string;
    name: string;
    status: CohortStatus;
    mode: ContentCohortMode;
  }>(
    `SELECT c.cohort_id::text, c.name, c.status, cc.mode
     FROM app_learning.content_cohorts cc
     JOIN app_core.cohorts c ON c.cohort_id = cc.cohort_id
     WHERE cc.content_id = $1::uuid
     ORDER BY c.name`,
    [contentId],
  );
  return rows.map((row) => ({
    cohortId: row.cohort_id,
    name: row.name,
    status: row.status,
    mode: row.mode,
  }));
}

/**
 * Fija la lista completa de cohortes de un contenido (reemplaza la anterior).
 * Lista vacía = sin restricción, vuelve al comportamiento por plan.
 */
export async function setContentCohorts(
  client: PoolClient,
  actor: AuthUser,
  contentId: string,
  cohortIds: string[],
  mode: ContentCohortMode = 'allow',
): Promise<ContentCohortAssignment[]> {
  if (mode !== 'allow' && mode !== 'deny') throw new Error('Modo de cohorte no válido.');
  await requireModulePermission(client, 'cohortes', 'update');
  const organizationId = await resolveOrganizationId(client, actor.userId);

  const ids = Array.from(new Set((cohortIds ?? []).map((id) => id.trim()).filter(Boolean)));

  const { rows: content } = await client.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM app_learning.content_items WHERE content_id = $1::uuid`,
    [contentId],
  );
  if (Number(content[0]?.n ?? 0) === 0) throw new Error('El contenido no existe.');

  if (ids.length > 0) {
    const { rows: valid } = await client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM app_core.cohorts
       WHERE cohort_id = ANY($1::uuid[]) AND organization_id = $2::uuid`,
      [ids, organizationId],
    );
    if (Number(valid[0]?.n ?? 0) !== ids.length) {
      throw new Error('Alguna de las cohortes indicadas no existe.');
    }
  }

  await client.query(
    `DELETE FROM app_learning.content_cohorts
     WHERE content_id = $1::uuid AND NOT (cohort_id = ANY($2::uuid[]))`,
    [contentId, ids],
  );

  if (ids.length > 0) {
    await client.query(
      `INSERT INTO app_learning.content_cohorts (content_id, cohort_id, created_by, mode)
       SELECT $1::uuid, unnest($2::uuid[]), $3::uuid, $4
       ON CONFLICT (content_id, cohort_id) DO UPDATE SET mode = EXCLUDED.mode`,
      [contentId, ids, actor.userId, mode],
    );
  }

  return getContentCohorts(client, actor, contentId);
}
