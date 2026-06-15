import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import type {
  CreatePopupInput,
  PopupFrequency,
  PopupRecord,
  PopupRole,
  PopupTargetMode,
  PopupTrigger,
  PublicPopup,
  UpdatePopupInput,
} from './types';
import { POPUP_ROLES } from './types';

interface PopupRow {
  popup_id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  trigger_type: PopupTrigger;
  delay_seconds: number;
  scroll_percent: number;
  target_mode: PopupTargetMode;
  target_paths: string[];
  target_roles: string[];
  target_plans: string[];
  frequency: PopupFrequency;
  title: string;
  message: string;
  cta_label: string;
  cta_url: string;
  dismiss_label: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const POPUP_SELECT = `
  popup_id::text, organization_id::text, name, is_active, trigger_type,
  delay_seconds, scroll_percent, target_mode, target_paths,
  target_roles, target_plans::text[] AS target_plans, frequency,
  title, message, cta_label, cta_url, dismiss_label, sort_order,
  created_at::text, updated_at::text
`;

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

function toRecord(row: PopupRow): PopupRecord {
  return {
    popupId: row.popup_id,
    organizationId: row.organization_id,
    name: row.name,
    isActive: row.is_active,
    triggerType: row.trigger_type,
    delaySeconds: row.delay_seconds,
    scrollPercent: row.scroll_percent,
    targetMode: row.target_mode,
    targetPaths: row.target_paths ?? [],
    targetRoles: (row.target_roles ?? []) as PopupRecord['targetRoles'],
    targetPlans: row.target_plans ?? [],
    frequency: row.frequency,
    title: row.title,
    message: row.message,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    dismissLabel: row.dismiss_label,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublic(row: PopupRow): PublicPopup {
  return {
    popupId: row.popup_id,
    triggerType: row.trigger_type,
    delaySeconds: row.delay_seconds,
    scrollPercent: row.scroll_percent,
    targetMode: row.target_mode,
    targetPaths: row.target_paths ?? [],
    frequency: row.frequency,
    title: row.title,
    message: row.message,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    dismissLabel: row.dismiss_label,
  };
}

function sanitizePaths(paths: string[] | undefined): string[] {
  return [...new Set((paths ?? []).map((p) => p.trim()).filter(Boolean))].slice(0, 100);
}

function sanitizeRoles(roles: PopupRole[] | undefined): PopupRole[] {
  const allowed = new Set(POPUP_ROLES);
  return [...new Set((roles ?? []).filter((r) => allowed.has(r)))];
}

function sanitizePlans(plans: string[] | undefined): string[] {
  return [...new Set((plans ?? []).map((p) => p.trim()).filter(Boolean))].slice(0, 100);
}

// ─── Admin CRUD ─────────────────────────────────────────────────────────────

export async function listPopups(client: PoolClient, actor: AuthUser): Promise<PopupRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<PopupRow>(
    `SELECT ${POPUP_SELECT} FROM app_admin.popups
     WHERE organization_id = $1 ORDER BY sort_order, created_at`,
    [orgId],
  );
  return rows.map(toRecord);
}

export async function getPopup(
  client: PoolClient,
  actor: AuthUser,
  popupId: string,
): Promise<PopupRecord | null> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<PopupRow>(
    `SELECT ${POPUP_SELECT} FROM app_admin.popups
     WHERE organization_id = $1 AND popup_id = $2 LIMIT 1`,
    [orgId, popupId],
  );
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function createPopup(
  client: PoolClient,
  actor: AuthUser,
  input: CreatePopupInput,
): Promise<PopupRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows: maxRows } = await client.query<{ next: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM app_admin.popups WHERE organization_id = $1`,
    [orgId],
  );
  const sortOrder = input.sortOrder ?? maxRows[0]?.next ?? 1;

  const { rows } = await client.query<PopupRow>(
    `INSERT INTO app_admin.popups
       (organization_id, name, is_active, trigger_type, delay_seconds, scroll_percent,
        target_mode, target_paths, target_roles, target_plans, frequency, title, message, cta_label, cta_url,
        dismiss_label, sort_order, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::uuid[],$11,$12,$13,$14,$15,$16,$17,$18,$18)
     RETURNING ${POPUP_SELECT}`,
    [
      orgId,
      input.name?.trim() ?? '',
      input.isActive ?? false,
      input.triggerType ?? 'time',
      input.delaySeconds ?? 5,
      input.scrollPercent ?? 40,
      input.targetMode ?? 'all',
      sanitizePaths(input.targetPaths),
      sanitizeRoles(input.targetRoles),
      sanitizePlans(input.targetPlans),
      input.frequency ?? 'session',
      input.title?.trim() ?? '',
      input.message?.trim() ?? '',
      input.ctaLabel?.trim() ?? '',
      input.ctaUrl?.trim() ?? '',
      input.dismissLabel?.trim() || 'No, gracias',
      sortOrder,
      actor.userId,
    ],
  );
  return toRecord(rows[0]);
}

export async function updatePopup(
  client: PoolClient,
  actor: AuthUser,
  popupId: string,
  input: UpdatePopupInput,
): Promise<PopupRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const setClauses: string[] = ['updated_by = $3'];
  const params: unknown[] = [orgId, popupId, actor.userId];
  let idx = 4;
  const push = (col: string, val: unknown) => {
    setClauses.push(`${col} = $${idx++}`);
    params.push(val);
  };

  if (input.name !== undefined) push('name', input.name.trim());
  if (input.isActive !== undefined) push('is_active', input.isActive);
  if (input.triggerType !== undefined) push('trigger_type', input.triggerType);
  if (input.delaySeconds !== undefined) push('delay_seconds', input.delaySeconds);
  if (input.scrollPercent !== undefined) push('scroll_percent', input.scrollPercent);
  if (input.targetMode !== undefined) push('target_mode', input.targetMode);
  if (input.targetPaths !== undefined) push('target_paths', sanitizePaths(input.targetPaths));
  if (input.targetRoles !== undefined) push('target_roles', sanitizeRoles(input.targetRoles));
  if (input.targetPlans !== undefined) {
    setClauses.push(`target_plans = $${idx}::uuid[]`);
    params.push(sanitizePlans(input.targetPlans));
    idx += 1;
  }
  if (input.frequency !== undefined) push('frequency', input.frequency);
  if (input.title !== undefined) push('title', input.title.trim());
  if (input.message !== undefined) push('message', input.message.trim());
  if (input.ctaLabel !== undefined) push('cta_label', input.ctaLabel.trim());
  if (input.ctaUrl !== undefined) push('cta_url', input.ctaUrl.trim());
  if (input.dismissLabel !== undefined) push('dismiss_label', input.dismissLabel.trim() || 'No, gracias');
  if (input.sortOrder !== undefined) push('sort_order', input.sortOrder);

  const { rows } = await client.query<PopupRow>(
    `UPDATE app_admin.popups SET ${setClauses.join(', ')}
     WHERE organization_id = $1 AND popup_id = $2
     RETURNING ${POPUP_SELECT}`,
    params,
  );
  if (!rows[0]) throw new Error('Popup no encontrado');
  return toRecord(rows[0]);
}

export async function deletePopup(client: PoolClient, actor: AuthUser, popupId: string): Promise<void> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  await client.query(`DELETE FROM app_admin.popups WHERE organization_id = $1 AND popup_id = $2`, [
    orgId,
    popupId,
  ]);
}

// ─── Público (sin permisos), con segmentación por rol/plan ──────────────────

/**
 * Popups activos aplicables al visitante. Si hay sesión (`identity`), se
 * resuelve su rol y plan y se filtran los popups segmentados; si es anónimo,
 * solo devuelve popups sin segmentación de rol/plan (arrays vacíos).
 */
export async function listPopupsForVisitor(
  client: PoolClient,
  identity: AuthUser | null,
): Promise<PublicPopup[]> {
  const { rows } = await client.query<PopupRow>(
    `SELECT ${POPUP_SELECT} FROM app_admin.popups
     WHERE is_active = true ORDER BY sort_order, created_at`,
  );

  let role: string | null = null;
  let planId: string | null = null;
  if (identity) {
    const { rows: userRows } = await client.query<{ primary_role: string; plan_id: string | null }>(
      `SELECT u.primary_role, p.subscription_plan_id::text AS plan_id
       FROM app_core.users u
       LEFT JOIN app_core.user_profiles p ON p.user_id = u.user_id
       WHERE u.user_id = $1 LIMIT 1`,
      [identity.userId],
    );
    role = userRows[0]?.primary_role ?? identity.role ?? null;
    planId = userRows[0]?.plan_id ?? null;
  }

  return rows
    .filter((row) => {
      const roles = row.target_roles ?? [];
      const plans = row.target_plans ?? [];
      const roleOk = roles.length === 0 || (role !== null && roles.includes(role));
      const planOk = plans.length === 0 || (planId !== null && plans.includes(planId));
      return roleOk && planOk;
    })
    .map(toPublic);
}
