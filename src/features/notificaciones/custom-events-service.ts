import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { resolveEventConfig } from './service';
import { dispatchNotification } from './engine';
import type {
  CustomEventRecord,
  CustomEventTriggerType,
  CustomEventAnchor,
  CustomEventOffsetUnit,
  CustomEventOffsetDirection,
  CreateCustomEventInput,
  UpdateCustomEventInput,
} from './types';

export type {
  CustomEventRecord,
  CreateCustomEventInput,
  UpdateCustomEventInput,
} from './types';

interface EventRow {
  event_id: string;
  event_key: string;
  module_code: string;
  label: string;
  description: string;
  variables: unknown;
  trigger_type: CustomEventTriggerType;
  trigger_anchor: string | null;
  trigger_parent_event: string | null;
  offset_value: number;
  offset_unit: CustomEventOffsetUnit;
  offset_direction: CustomEventOffsetDirection;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: EventRow): CustomEventRecord {
  return {
    eventId: row.event_id,
    eventKey: row.event_key,
    moduleCode: row.module_code,
    label: row.label,
    description: row.description,
    variables: Array.isArray(row.variables) ? (row.variables as string[]) : [],
    triggerType: row.trigger_type,
    triggerAnchor: (row.trigger_anchor as CustomEventAnchor) ?? null,
    triggerParentEvent: row.trigger_parent_event,
    offsetValue: Number(row.offset_value ?? 0),
    offsetUnit: row.offset_unit,
    offsetDirection: row.offset_direction,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function actorOrganizationId(client: PoolClient, actor: AuthUser): Promise<string> {
  const { rows } = await client.query<{ organization_id: string | null }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1::uuid LIMIT 1`,
    [actor.userId],
  );
  const org = rows[0]?.organization_id;
  if (!org) throw new Error('No se pudo resolver la organización del usuario.');
  return org;
}

function slugifyKey(label: string): string {
  const slug = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return `custom.${slug || 'evento'}`;
}

const SELECT = `
  event_id::text, event_key, module_code, label, description, variables,
  trigger_type, trigger_anchor, trigger_parent_event, offset_value, offset_unit,
  offset_direction, is_active, organization_id::text, created_at::text, updated_at::text
`;

export async function listCustomEvents(
  client: PoolClient,
  actor: AuthUser,
): Promise<CustomEventRecord[]> {
  await requireModulePermission(client, 'usuarios', 'view');
  const organizationId = await actorOrganizationId(client, actor);
  const { rows } = await client.query<EventRow>(
    `SELECT ${SELECT} FROM app_admin.notification_events
     WHERE organization_id = $1::uuid ORDER BY module_code, label`,
    [organizationId],
  );
  return rows.map(toRecord);
}

export async function createCustomEvent(
  client: PoolClient,
  actor: AuthUser,
  input: CreateCustomEventInput,
): Promise<CustomEventRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const organizationId = await actorOrganizationId(client, actor);
  const label = input.label.trim();
  if (!label) throw new Error('El nombre del evento es obligatorio.');
  if (!input.moduleCode.trim()) throw new Error('El módulo es obligatorio.');
  const eventKey = slugifyKey(label);

  const dup = await client.query(
    `SELECT 1 FROM app_admin.notification_events WHERE organization_id = $1::uuid AND event_key = $2`,
    [organizationId, eventKey],
  );
  if (dup.rows.length > 0) {
    throw new Error('Ya existe un evento con un nombre similar. Usa otro nombre.');
  }

  const { rows } = await client.query<EventRow>(
    `INSERT INTO app_admin.notification_events
       (organization_id, event_key, module_code, label, description, variables,
        trigger_type, trigger_anchor, trigger_parent_event, offset_value, offset_unit,
        offset_direction, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING ${SELECT}`,
    [
      organizationId,
      eventKey,
      input.moduleCode.trim(),
      label,
      input.description?.trim() ?? '',
      JSON.stringify(input.variables ?? []),
      input.triggerType,
      input.triggerType === 'date_anchor' ? input.triggerAnchor ?? null : null,
      input.triggerType === 'event_dependency' ? input.triggerParentEvent ?? null : null,
      Math.max(0, Math.trunc(input.offsetValue ?? 0)),
      input.offsetUnit ?? 'days',
      input.offsetDirection ?? 'after',
      input.isActive ?? true,
      actor.userId,
    ],
  );
  return toRecord(rows[0]);
}

export async function updateCustomEvent(
  client: PoolClient,
  actor: AuthUser,
  eventId: string,
  input: UpdateCustomEventInput,
): Promise<CustomEventRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const organizationId = await actorOrganizationId(client, actor);

  const fields: Array<[string, unknown]> = [
    ['module_code', input.moduleCode?.trim()],
    ['label', input.label?.trim()],
    ['description', input.description === undefined ? undefined : (input.description?.trim() ?? '')],
    ['variables', input.variables === undefined ? undefined : JSON.stringify(input.variables)],
    ['trigger_type', input.triggerType],
    ['trigger_anchor', input.triggerAnchor === undefined ? undefined : (input.triggerAnchor ?? null)],
    ['trigger_parent_event', input.triggerParentEvent === undefined ? undefined : (input.triggerParentEvent ?? null)],
    ['offset_value', input.offsetValue === undefined ? undefined : Math.max(0, Math.trunc(input.offsetValue))],
    ['offset_unit', input.offsetUnit],
    ['offset_direction', input.offsetDirection],
    ['is_active', input.isActive],
  ];
  const setClauses: string[] = ['updated_at = now()'];
  const params: unknown[] = [eventId, organizationId];
  let idx = 3;
  for (const [col, val] of fields) {
    if (val !== undefined) {
      // variables se castea a jsonb
      setClauses.push(col === 'variables' ? `${col} = $${idx++}::jsonb` : `${col} = $${idx++}`);
      params.push(val);
    }
  }
  const { rows } = await client.query<EventRow>(
    `UPDATE app_admin.notification_events
       SET ${setClauses.join(', ')}
     WHERE event_id = $1::uuid AND organization_id = $2::uuid
     RETURNING ${SELECT}`,
    params,
  );
  if (!rows[0]) throw new Error('Evento no encontrado.');
  return toRecord(rows[0]);
}

export async function deleteCustomEvent(
  client: PoolClient,
  actor: AuthUser,
  eventId: string,
): Promise<{ eventId: string }> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const organizationId = await actorOrganizationId(client, actor);
  await client.query(
    `DELETE FROM app_admin.notification_events WHERE event_id = $1::uuid AND organization_id = $2::uuid`,
    [eventId, organizationId],
  );
  return { eventId };
}

// ─── Evaluador del cron: dispara los eventos automáticos que correspondan ─────

function signedOffset(ev: EventRow): { days: number; hours: number } {
  const sign = ev.offset_direction === 'before' ? -1 : 1;
  const value = sign * Number(ev.offset_value ?? 0);
  return ev.offset_unit === 'hours' ? { days: 0, hours: value } : { days: value, hours: 0 };
}

async function fireDateAnchor(client: PoolClient, ev: EventRow): Promise<number> {
  let join = '';
  let anchorExpr = '';
  if (ev.trigger_anchor === 'registration') {
    anchorExpr = 'u.created_at';
  } else if (ev.trigger_anchor === 'subscription_expiry') {
    join = 'JOIN app_core.user_profiles p ON p.user_id = u.user_id';
    anchorExpr = 'p.subscription_expires_at';
  } else {
    return 0;
  }
  const { days, hours } = signedOffset(ev);
  const { rows } = await client.query<{ user_id: string; display_name: string; email: string }>(
    `SELECT u.user_id::text, u.display_name, u.email
       FROM app_core.users u ${join}
      WHERE u.organization_id = $1::uuid
        AND u.is_active = true
        AND u.email IS NOT NULL
        AND ${anchorExpr} IS NOT NULL
        AND ${anchorExpr} + make_interval(days => $2, hours => $3) <= now()
        AND NOT EXISTS (
          SELECT 1 FROM app_admin.notification_event_sends s
          WHERE s.organization_id = $1::uuid AND s.event_key = $4 AND s.user_id = u.user_id
        )
      LIMIT 200`,
    [ev.organization_id, days, hours, ev.event_key],
  );
  let count = 0;
  for (const r of rows) {
    await dispatchNotification(client, {
      organizationId: ev.organization_id,
      eventKey: ev.event_key,
      recipientUserId: r.user_id,
      recipientEmail: r.email,
      variables: { nombre: r.display_name },
    });
    await client.query(
      `INSERT INTO app_admin.notification_event_sends (organization_id, event_key, user_id, fire_key)
       VALUES ($1::uuid, $2, $3::uuid, 'anchor') ON CONFLICT DO NOTHING`,
      [ev.organization_id, ev.event_key, r.user_id],
    );
    count++;
  }
  return count;
}

async function fireEventDependency(client: PoolClient, ev: EventRow): Promise<number> {
  if (!ev.trigger_parent_event) return 0;
  const { days, hours } = signedOffset(ev);
  const { rows } = await client.query<{
    user_id: string;
    display_name: string;
    email: string;
    fire_key: string;
  }>(
    `SELECT n.user_id::text, u.display_name, u.email, n.created_at::text AS fire_key
       FROM app_core.notifications n
       JOIN app_core.users u ON u.user_id = n.user_id
      WHERE n.organization_id = $1::uuid
        AND n.event_key = $2
        AND u.is_active = true
        AND u.email IS NOT NULL
        AND n.created_at + make_interval(days => $3, hours => $4) <= now()
        AND NOT EXISTS (
          SELECT 1 FROM app_admin.notification_event_sends s
          WHERE s.organization_id = $1::uuid AND s.event_key = $5
            AND s.user_id = n.user_id AND s.fire_key = n.created_at::text
        )
      LIMIT 200`,
    [ev.organization_id, ev.trigger_parent_event, days, hours, ev.event_key],
  );
  let count = 0;
  for (const r of rows) {
    await dispatchNotification(client, {
      organizationId: ev.organization_id,
      eventKey: ev.event_key,
      recipientUserId: r.user_id,
      recipientEmail: r.email,
      variables: { nombre: r.display_name },
    });
    await client.query(
      `INSERT INTO app_admin.notification_event_sends (organization_id, event_key, user_id, fire_key)
       VALUES ($1::uuid, $2, $3::uuid, $4) ON CONFLICT DO NOTHING`,
      [ev.organization_id, ev.event_key, r.user_id, r.fire_key],
    );
    count++;
  }
  return count;
}

/** Evalúa y dispara los eventos personalizados automáticos. Llamado desde el cron. */
export async function processCustomEventSchedules(client: PoolClient): Promise<{ fired: number }> {
  const { rows: events } = await client.query<EventRow>(
    `SELECT ${SELECT} FROM app_admin.notification_events
      WHERE is_active = true AND trigger_type IN ('date_anchor', 'event_dependency')`,
  );
  let fired = 0;
  for (const ev of events) {
    try {
      // Solo dispara si el evento tiene plantilla y está habilitado (defensivo:
      // un evento a medio configurar nunca envía correos).
      const cfg = await resolveEventConfig(client, ev.organization_id, ev.event_key);
      if (!cfg.isEnabled || !cfg.template) continue;
      fired +=
        ev.trigger_type === 'date_anchor'
          ? await fireDateAnchor(client, ev)
          : await fireEventDependency(client, ev);
    } catch (error) {
      console.error('[custom-events] evento falló:', ev.event_key, error);
    }
  }
  return { fired };
}
