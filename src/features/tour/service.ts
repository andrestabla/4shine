import type { PoolClient } from 'pg';
import { hasModulePermission, requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import type { ModuleCode, PermissionAction } from '@/lib/permissions';
import { getAnchor } from './catalog';
import type {
  AppliedTourStep,
  CreateTourStepInput,
  FinishTourInput,
  MyTourPayload,
  RecordStepInput,
  TourAnalytics,
  TourAnalyticsRoleRow,
  TourRole,
  TourSettingsRecord,
  TourStepRecord,
  UpdateTourStepInput,
} from './types';
import { TOUR_ROLES } from './types';

// ─── Row types ──────────────────────────────────────────────────────────────

interface StepRow {
  step_id: string;
  organization_id: string;
  step_key: string;
  anchor_key: string;
  title: string;
  body_html: string;
  visible_roles: string[];
  sort_order: number;
  is_active: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SettingsRow {
  organization_id: string;
  current_version: number;
  is_enabled: boolean;
  updated_at: string;
}

const STEP_SELECT = `
  step_id::text, organization_id::text, step_key, anchor_key, title, body_html,
  visible_roles, sort_order, is_active, is_system, created_by::text,
  created_at::text, updated_at::text
`;

// ─── Org resolution ─────────────────────────────────────────────────────────

async function resolveOrgId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (rows[0]?.organization_id) return rows[0].organization_id;
  const { rows: fallback } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.organizations ORDER BY created_at ASC LIMIT 1`,
  );
  if (fallback[0]?.organization_id) return fallback[0].organization_id;
  throw new Error('Organization not found');
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function toStepRecord(row: StepRow): TourStepRecord {
  return {
    stepId: row.step_id,
    organizationId: row.organization_id,
    stepKey: row.step_key,
    anchorKey: row.anchor_key,
    title: row.title,
    bodyHtml: row.body_html,
    visibleRoles: (row.visible_roles ?? []) as TourRole[],
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isSystem: row.is_system,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeRoles(roles: TourRole[] | undefined): TourRole[] {
  const set = new Set(TOUR_ROLES);
  return [...new Set((roles ?? []).filter((r) => set.has(r)))];
}

// ─── Settings ───────────────────────────────────────────────────────────────

async function loadSettings(client: PoolClient, orgId: string): Promise<SettingsRow> {
  const { rows } = await client.query<SettingsRow>(
    `SELECT organization_id::text, current_version, is_enabled, updated_at::text
     FROM app_admin.tour_settings WHERE organization_id = $1 LIMIT 1`,
    [orgId],
  );
  if (rows[0]) return rows[0];
  const { rows: created } = await client.query<SettingsRow>(
    `INSERT INTO app_admin.tour_settings (organization_id)
     VALUES ($1)
     ON CONFLICT (organization_id) DO UPDATE SET organization_id = EXCLUDED.organization_id
     RETURNING organization_id::text, current_version, is_enabled, updated_at::text`,
    [orgId],
  );
  return created[0];
}

function toSettingsRecord(row: SettingsRow): TourSettingsRecord {
  return {
    organizationId: row.organization_id,
    currentVersion: row.current_version,
    isEnabled: row.is_enabled,
    updatedAt: row.updated_at,
  };
}

export async function getSettings(client: PoolClient, actor: AuthUser): Promise<TourSettingsRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  return toSettingsRecord(await loadSettings(client, orgId));
}

export async function setEnabled(
  client: PoolClient,
  actor: AuthUser,
  isEnabled: boolean,
): Promise<TourSettingsRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  await loadSettings(client, orgId);
  const { rows } = await client.query<SettingsRow>(
    `UPDATE app_admin.tour_settings
     SET is_enabled = $2, updated_by = $3
     WHERE organization_id = $1
     RETURNING organization_id::text, current_version, is_enabled, updated_at::text`,
    [orgId, isEnabled, actor.userId],
  );
  return toSettingsRecord(rows[0]);
}

export async function resetTour(client: PoolClient, actor: AuthUser): Promise<TourSettingsRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  await loadSettings(client, orgId);
  const { rows } = await client.query<SettingsRow>(
    `UPDATE app_admin.tour_settings
     SET current_version = current_version + 1, updated_by = $2
     WHERE organization_id = $1
     RETURNING organization_id::text, current_version, is_enabled, updated_at::text`,
    [orgId, actor.userId],
  );
  return toSettingsRecord(rows[0]);
}

// ─── Step CRUD (admin) ──────────────────────────────────────────────────────

export async function listSteps(client: PoolClient, actor: AuthUser): Promise<TourStepRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<StepRow>(
    `SELECT ${STEP_SELECT} FROM app_admin.tour_steps
     WHERE organization_id = $1
     ORDER BY sort_order, created_at`,
    [orgId],
  );
  return rows.map(toStepRecord);
}

export async function getStep(
  client: PoolClient,
  actor: AuthUser,
  stepId: string,
): Promise<TourStepRecord | null> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<StepRow>(
    `SELECT ${STEP_SELECT} FROM app_admin.tour_steps
     WHERE organization_id = $1 AND step_id = $2 LIMIT 1`,
    [orgId, stepId],
  );
  return rows[0] ? toStepRecord(rows[0]) : null;
}

function generateStepKey(anchorKey: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${anchorKey}-${suffix}`;
}

export async function createStep(
  client: PoolClient,
  actor: AuthUser,
  input: CreateTourStepInput,
): Promise<TourStepRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  if (!getAnchor(input.anchorKey)) {
    throw new Error(`Objetivo (anchor) inválido: ${input.anchorKey}`);
  }
  const roles = sanitizeRoles(input.visibleRoles);
  if (roles.length === 0) {
    throw new Error('Selecciona al menos un rol que verá este paso.');
  }

  const stepKey = (input.stepKey?.trim() || generateStepKey(input.anchorKey)).toLowerCase();

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const { rows } = await client.query<{ next: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM app_admin.tour_steps WHERE organization_id = $1`,
      [orgId],
    );
    sortOrder = rows[0]?.next ?? 1;
  }

  const { rows } = await client.query<StepRow>(
    `INSERT INTO app_admin.tour_steps
       (organization_id, step_key, anchor_key, title, body_html, visible_roles, sort_order, is_active, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
     RETURNING ${STEP_SELECT}`,
    [
      orgId,
      stepKey,
      input.anchorKey,
      input.title?.trim() ?? '',
      input.bodyHtml ?? '',
      roles,
      sortOrder,
      input.isActive ?? true,
      actor.userId,
    ],
  );
  return toStepRecord(rows[0]);
}

export async function updateStep(
  client: PoolClient,
  actor: AuthUser,
  stepId: string,
  input: UpdateTourStepInput,
): Promise<TourStepRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  if (input.anchorKey !== undefined && !getAnchor(input.anchorKey)) {
    throw new Error(`Objetivo (anchor) inválido: ${input.anchorKey}`);
  }

  const setClauses: string[] = ['updated_by = $3'];
  const params: unknown[] = [orgId, stepId, actor.userId];
  let idx = 4;
  const push = (col: string, val: unknown) => {
    setClauses.push(`${col} = $${idx++}`);
    params.push(val);
  };

  if (input.anchorKey !== undefined) push('anchor_key', input.anchorKey);
  if (input.title !== undefined) push('title', input.title.trim());
  if (input.bodyHtml !== undefined) push('body_html', input.bodyHtml);
  if (input.visibleRoles !== undefined) {
    const roles = sanitizeRoles(input.visibleRoles);
    if (roles.length === 0) throw new Error('Selecciona al menos un rol que verá este paso.');
    push('visible_roles', roles);
  }
  if (input.sortOrder !== undefined) push('sort_order', input.sortOrder);
  if (input.isActive !== undefined) push('is_active', input.isActive);

  const { rows } = await client.query<StepRow>(
    `UPDATE app_admin.tour_steps SET ${setClauses.join(', ')}
     WHERE organization_id = $1 AND step_id = $2
     RETURNING ${STEP_SELECT}`,
    params,
  );
  if (!rows[0]) throw new Error('Paso no encontrado');
  return toStepRecord(rows[0]);
}

export async function deleteStep(client: PoolClient, actor: AuthUser, stepId: string): Promise<void> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<{ is_system: boolean }>(
    `SELECT is_system FROM app_admin.tour_steps WHERE organization_id = $1 AND step_id = $2 LIMIT 1`,
    [orgId, stepId],
  );
  if (!rows[0]) throw new Error('Paso no encontrado');
  if (rows[0].is_system) {
    throw new Error('Los pasos del sistema no se pueden eliminar; desactívalos en su lugar.');
  }
  await client.query(`DELETE FROM app_admin.tour_steps WHERE organization_id = $1 AND step_id = $2`, [
    orgId,
    stepId,
  ]);
}

export async function reorderSteps(
  client: PoolClient,
  actor: AuthUser,
  orderedStepIds: string[],
): Promise<TourStepRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  let order = 1;
  for (const stepId of orderedStepIds) {
    await client.query(
      `UPDATE app_admin.tour_steps SET sort_order = $3, updated_by = $4
       WHERE organization_id = $1 AND step_id = $2`,
      [orgId, stepId, order, actor.userId],
    );
    order += 1;
  }
  return listSteps(client, actor);
}

// ─── User-facing ────────────────────────────────────────────────────────────

export async function getMyTour(client: PoolClient, actor: AuthUser): Promise<MyTourPayload> {
  const orgId = await resolveOrgId(client, actor.userId);
  const settings = await loadSettings(client, orgId);
  const role = actor.role as TourRole;

  const { rows } = await client.query<StepRow>(
    `SELECT ${STEP_SELECT} FROM app_admin.tour_steps
     WHERE organization_id = $1 AND is_active = true AND $2 = ANY(visible_roles)
     ORDER BY sort_order, created_at`,
    [orgId, role],
  );

  const steps: AppliedTourStep[] = [];
  for (const row of rows) {
    const anchor = getAnchor(row.anchor_key);
    if (!anchor) continue;
    if (anchor.moduleCode) {
      const allowed = await hasModulePermission(
        client,
        anchor.moduleCode as ModuleCode,
        (anchor.requiredAction ?? 'view') as PermissionAction,
      );
      if (!allowed) continue;
    }
    steps.push({
      stepKey: row.step_key,
      title: row.title,
      bodyHtml: row.body_html,
      sortOrder: row.sort_order,
      anchor: {
        key: anchor.key,
        selector: anchor.selector,
        route: anchor.route,
        area: anchor.area,
        moduleCode: anchor.moduleCode,
      },
    });
  }

  const { rows: progressRows } = await client.query<{
    status: string;
    last_step_index: number;
  }>(
    `SELECT status, last_step_index FROM app_core.tour_progress
     WHERE user_id = $1 AND tour_version = $2 LIMIT 1`,
    [actor.userId, settings.current_version],
  );
  const progress = progressRows[0] ?? null;
  const status = (progress?.status ?? null) as MyTourPayload['status'];

  const finished = status === 'completed' || status === 'dismissed';
  const shouldAutoStart = settings.is_enabled && steps.length > 0 && !finished;
  const resumeIndex =
    status === 'in_progress'
      ? Math.min(Math.max(progress?.last_step_index ?? 0, 0), Math.max(steps.length - 1, 0))
      : 0;

  return {
    enabled: settings.is_enabled,
    version: settings.current_version,
    shouldAutoStart,
    resumeIndex,
    status,
    steps,
  };
}

async function currentVersion(client: PoolClient, orgId: string): Promise<number> {
  const settings = await loadSettings(client, orgId);
  return settings.current_version;
}

export async function recordStepView(
  client: PoolClient,
  actor: AuthUser,
  input: RecordStepInput,
): Promise<void> {
  const orgId = await resolveOrgId(client, actor.userId);
  const version = await currentVersion(client, orgId);
  const role = actor.role;
  const total = Math.max(input.totalSteps, 1);

  await client.query(
    `INSERT INTO app_core.tour_step_events
       (user_id, organization_id, tour_version, role_at_event, step_key, step_index)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, tour_version, step_key) DO NOTHING`,
    [actor.userId, orgId, version, role, input.stepKey, input.stepIndex],
  );

  const { rows } = await client.query<{ viewed: number }>(
    `SELECT COUNT(*)::int AS viewed FROM app_core.tour_step_events
     WHERE user_id = $1 AND tour_version = $2`,
    [actor.userId, version],
  );
  const viewed = rows[0]?.viewed ?? 1;
  const pct = Math.min(100, Math.round((viewed / total) * 10000) / 100);

  await client.query(
    `INSERT INTO app_core.tour_progress
       (user_id, organization_id, tour_version, role_at_start, total_steps,
        last_step_key, last_step_index, viewed_count, completion_pct, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'in_progress')
     ON CONFLICT (user_id, tour_version) DO UPDATE SET
       total_steps     = GREATEST(app_core.tour_progress.total_steps, EXCLUDED.total_steps),
       last_step_key   = EXCLUDED.last_step_key,
       last_step_index = EXCLUDED.last_step_index,
       viewed_count    = EXCLUDED.viewed_count,
       completion_pct  = CASE WHEN app_core.tour_progress.status = 'completed'
                              THEN app_core.tour_progress.completion_pct
                              ELSE EXCLUDED.completion_pct END,
       status          = CASE WHEN app_core.tour_progress.status = 'completed'
                              THEN 'completed' ELSE 'in_progress' END`,
    [actor.userId, orgId, version, role, total, input.stepKey, input.stepIndex, viewed, pct],
  );
}

export async function finishTour(
  client: PoolClient,
  actor: AuthUser,
  input: FinishTourInput,
): Promise<void> {
  const orgId = await resolveOrgId(client, actor.userId);
  const version = await currentVersion(client, orgId);
  const role = actor.role;
  const total = Math.max(input.totalSteps ?? 1, 1);
  const completed = input.status === 'completed';

  const { rows } = await client.query<{ viewed: number }>(
    `SELECT COUNT(*)::int AS viewed FROM app_core.tour_step_events
     WHERE user_id = $1 AND tour_version = $2`,
    [actor.userId, version],
  );
  const viewed = rows[0]?.viewed ?? 0;
  const pct = completed ? 100 : Math.min(100, Math.round((viewed / total) * 10000) / 100);

  await client.query(
    `INSERT INTO app_core.tour_progress
       (user_id, organization_id, tour_version, role_at_start, total_steps,
        last_step_key, last_step_index, viewed_count, completion_pct, status,
        completed_at, dismissed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        CASE WHEN $10 = 'completed' THEN now() ELSE NULL END,
        CASE WHEN $10 = 'dismissed' THEN now() ELSE NULL END)
     ON CONFLICT (user_id, tour_version) DO UPDATE SET
       total_steps     = GREATEST(app_core.tour_progress.total_steps, EXCLUDED.total_steps),
       last_step_key   = COALESCE(EXCLUDED.last_step_key, app_core.tour_progress.last_step_key),
       last_step_index = EXCLUDED.last_step_index,
       viewed_count    = EXCLUDED.viewed_count,
       completion_pct  = EXCLUDED.completion_pct,
       status          = EXCLUDED.status,
       completed_at    = CASE WHEN $10 = 'completed' THEN now() ELSE app_core.tour_progress.completed_at END,
       dismissed_at    = CASE WHEN $10 = 'dismissed' THEN now() ELSE app_core.tour_progress.dismissed_at END`,
    [
      actor.userId,
      orgId,
      version,
      role,
      total,
      input.lastStepKey ?? null,
      input.lastStepIndex ?? 0,
      viewed,
      pct,
      input.status,
    ],
  );
}

// ─── Analytics (admin) ──────────────────────────────────────────────────────

export async function getAnalytics(client: PoolClient, actor: AuthUser): Promise<TourAnalytics> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const version = await currentVersion(client, orgId);

  const { rows: progressRows } = await client.query<{
    role: string;
    started: number;
    completed: number;
    dismissed: number;
    in_progress: number;
    avg_pct: number;
  }>(
    `SELECT role_at_start AS role,
            COUNT(*)::int AS started,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
            COUNT(*) FILTER (WHERE status = 'dismissed')::int AS dismissed,
            COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
            COALESCE(AVG(completion_pct), 0)::float AS avg_pct
     FROM app_core.tour_progress
     WHERE organization_id = $1 AND tour_version = $2
     GROUP BY role_at_start`,
    [orgId, version],
  );

  const byRole: TourAnalyticsRoleRow[] = progressRows.map((r) => ({
    role: r.role as TourRole,
    started: r.started,
    completed: r.completed,
    dismissed: r.dismissed,
    inProgress: r.in_progress,
    avgCompletionPct: Math.round(r.avg_pct * 100) / 100,
  }));

  const started = byRole.reduce((a, r) => a + r.started, 0);
  const completed = byRole.reduce((a, r) => a + r.completed, 0);
  const dismissed = byRole.reduce((a, r) => a + r.dismissed, 0);
  const inProgress = byRole.reduce((a, r) => a + r.inProgress, 0);
  const avgCompletionPct =
    started > 0
      ? Math.round(
          (byRole.reduce((a, r) => a + r.avgCompletionPct * r.started, 0) / started) * 100,
        ) / 100
      : 0;

  const { rows: funnelRows } = await client.query<{
    step_key: string;
    title: string;
    sort_order: number;
    role: string | null;
    views: number;
  }>(
    `SELECT s.step_key, s.title, s.sort_order, e.role_at_event AS role, COUNT(e.event_id)::int AS views
     FROM app_admin.tour_steps s
     LEFT JOIN app_core.tour_step_events e
       ON e.step_key = s.step_key AND e.organization_id = s.organization_id AND e.tour_version = $2
     WHERE s.organization_id = $1 AND s.is_active = true
     GROUP BY s.step_key, s.title, s.sort_order, e.role_at_event
     ORDER BY s.sort_order`,
    [orgId, version],
  );

  const funnelMap = new Map<
    string,
    { stepKey: string; title: string; sortOrder: number; perRole: Map<TourRole, number> }
  >();
  for (const row of funnelRows) {
    let entry = funnelMap.get(row.step_key);
    if (!entry) {
      entry = { stepKey: row.step_key, title: row.title, sortOrder: row.sort_order, perRole: new Map() };
      funnelMap.set(row.step_key, entry);
    }
    if (row.role && TOUR_ROLES.includes(row.role as TourRole) && row.views > 0) {
      entry.perRole.set(row.role as TourRole, row.views);
    }
  }

  const funnel = [...funnelMap.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((entry) => {
      const perRole = TOUR_ROLES.map((role) => ({ role, views: entry.perRole.get(role) ?? 0 }));
      return {
        stepKey: entry.stepKey,
        title: entry.title,
        sortOrder: entry.sortOrder,
        totalViews: perRole.reduce((a, c) => a + c.views, 0),
        perRole,
      };
    });

  return {
    version,
    global: {
      started,
      completed,
      dismissed,
      inProgress,
      completionRate: started > 0 ? Math.round((completed / started) * 10000) / 100 : 0,
      avgCompletionPct,
    },
    byRole,
    funnel,
  };
}
