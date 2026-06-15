import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import type {
  CreatePopupInput,
  PopupFrequency,
  PopupRecord,
  PopupTargetMode,
  PopupTrigger,
  PublicPopup,
  UpdatePopupInput,
} from './types';

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
  delay_seconds, scroll_percent, target_mode, target_paths, frequency,
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
        target_mode, target_paths, frequency, title, message, cta_label, cta_url,
        dismiss_label, sort_order, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16)
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

// ─── Público (sin permisos) ─────────────────────────────────────────────────

export async function listActivePopups(client: PoolClient): Promise<PublicPopup[]> {
  const { rows } = await client.query<PopupRow>(
    `SELECT ${POPUP_SELECT} FROM app_admin.popups
     WHERE is_active = true ORDER BY sort_order, created_at`,
  );
  return rows.map(toPublic);
}
