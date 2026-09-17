import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { resolveEventConfig } from './service';
import { dispatchNotification } from './engine';
import { customEventToEventDef } from './events-catalog';
import type {
  NotificationEventDef,
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
  repeat_interval_hours: number;
  require_active_plan: boolean;
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
    repeatIntervalHours: Number(row.repeat_interval_hours ?? 0),
    requireActivePlan: Boolean(row.require_active_plan),
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
  offset_direction, repeat_interval_hours, require_active_plan, is_active,
  organization_id::text, created_at::text, updated_at::text
`;

export async function listCustomEvents(
  client: PoolClient,
  actor: AuthUser,
): Promise<CustomEventRecord[]> {
  await requireModulePermission(client, 'notificaciones', 'view');
  const organizationId = await actorOrganizationId(client, actor);
  const { rows } = await client.query<EventRow>(
    `SELECT ${SELECT} FROM app_admin.notification_events
     WHERE organization_id = $1::uuid ORDER BY module_code, label`,
    [organizationId],
  );
  return rows.map(toRecord);
}

/**
 * Definición (formato catálogo) de un evento personalizado de la organización,
 * o null si no existe. Sin chequeo de permisos: uso interno del servidor.
 */
export async function getCustomEventDefByKey(
  client: PoolClient,
  organizationId: string,
  eventKey: string,
): Promise<NotificationEventDef | null> {
  const { rows } = await client.query<EventRow>(
    `SELECT ${SELECT} FROM app_admin.notification_events
     WHERE organization_id = $1::uuid AND event_key = $2 LIMIT 1`,
    [organizationId, eventKey],
  );
  return rows[0] ? customEventToEventDef(toRecord(rows[0])) : null;
}

export async function createCustomEvent(
  client: PoolClient,
  actor: AuthUser,
  input: CreateCustomEventInput,
): Promise<CustomEventRecord> {
  await requireModulePermission(client, 'notificaciones', 'manage');
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
        offset_direction, repeat_interval_hours, require_active_plan, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
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
      Math.max(0, Math.trunc(input.repeatIntervalHours ?? 0)),
      input.requireActivePlan ?? false,
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
  await requireModulePermission(client, 'notificaciones', 'manage');
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
    ['repeat_interval_hours', input.repeatIntervalHours === undefined ? undefined : Math.max(0, Math.trunc(input.repeatIntervalHours))],
    ['require_active_plan', input.requireActivePlan],
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
  await requireModulePermission(client, 'notificaciones', 'manage');
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

function fullName(first: string | null, last: string | null, display: string): string {
  const composed = [first, last].filter(Boolean).join(' ').trim();
  return composed || display;
}

/** Condición SQL de "plan de suscripción activo" (alias `u` = users). */
const ACTIVE_PLAN_SQL = `EXISTS (
  SELECT 1
    FROM app_core.user_profiles up
    JOIN app_billing.subscription_plans sp ON sp.plan_id = up.subscription_plan_id
   WHERE up.user_id = u.user_id
     AND sp.is_active = true
     AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > now())
)`;

/**
 * Mapea cada ancla a su JOIN, la expresión de la fecha de referencia y una
 * condición extra opcional que debe seguir cumpliéndose para disparar.
 */
function anchorSql(anchor: string | null): { join: string; expr: string; where?: string } | null {
  switch (anchor) {
    case 'registration':
      return { join: '', expr: 'u.created_at' };
    case 'subscription_expiry':
      return { join: 'JOIN app_core.user_profiles p ON p.user_id = u.user_id', expr: 'p.subscription_expires_at' };
    case 'program_start':
      return { join: 'JOIN app_core.user_profiles p ON p.user_id = u.user_id', expr: 'p.subscription_started_at' };
    case 'last_login':
      return {
        join:
          'JOIN LATERAL (SELECT max(last_used_at) AS ts FROM app_auth.refresh_sessions rs WHERE rs.user_id = u.user_id) ll ON true',
        expr: 'll.ts',
      };
    case 'never_logged_in':
      // Usuarios que jamás han iniciado sesión: no existe ninguna refresh_session
      // (ni siquiera revocada). El ancla es la fecha de creación de la cuenta; en
      // cuanto el usuario ingresa, la condición deja de cumplirse y se detiene.
      return {
        join: '',
        expr: 'u.created_at',
        where: 'NOT EXISTS (SELECT 1 FROM app_auth.refresh_sessions rs WHERE rs.user_id = u.user_id)',
      };
    default:
      return null;
  }
}

async function fireDateAnchor(client: PoolClient, ev: EventRow): Promise<number> {
  const a = anchorSql(ev.trigger_anchor);
  if (!a) return 0;
  const { days, hours } = signedOffset(ev);
  const repeatHours = Math.max(0, Number(ev.repeat_interval_hours ?? 0));
  const dueExpr = `${a.expr} + make_interval(days => $2, hours => $3)`;
  // fire_key = el timestamp del ancla. Para anclas fijas (registro, inicio de
  // programa, vencimiento) es constante → dispara una vez. Para 'last_login'
  // cambia en cada acceso → permite re-disparar tras un nuevo periodo de inactividad.
  // Si el evento se repite cada N horas, el fire_key lleva además el número de
  // periodo transcurrido desde la fecha objetivo (ancla + desfase), de modo que
  // cada periodo se envía una sola vez y sin ráfagas si el cron estuvo detenido.
  const fireKeyExpr =
    repeatHours > 0
      ? `${a.expr}::text || '#' || floor(extract(epoch FROM (now() - (${dueExpr}))) / ($5 * 3600))::int::text`
      : `${a.expr}::text`;
  const extraWhere = [a.where, ev.require_active_plan ? ACTIVE_PLAN_SQL : null]
    .filter(Boolean)
    .map((w) => `AND ${w}`)
    .join('\n        ');
  const { rows } = await client.query<{
    user_id: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    fire_key: string;
    fecha_fmt: string;
  }>(
    `SELECT u.user_id::text, u.display_name, u.first_name, u.last_name, u.email,
            ${fireKeyExpr} AS fire_key,
            to_char(${a.expr}, 'DD/MM/YYYY') AS fecha_fmt
       FROM app_core.users u ${a.join}
      WHERE u.organization_id = $1::uuid
        AND u.is_active = true
        AND u.email IS NOT NULL
        AND ${a.expr} IS NOT NULL
        AND ${dueExpr} <= now()
        ${extraWhere}
        AND NOT EXISTS (
          SELECT 1 FROM app_admin.notification_event_sends s
          WHERE s.organization_id = $1::uuid AND s.event_key = $4
            AND s.user_id = u.user_id AND s.fire_key = ${fireKeyExpr}
        )
      LIMIT 200`,
    // $5 solo se referencia cuando el evento se repite (pg rechaza parámetros sobrantes).
    repeatHours > 0
      ? [ev.organization_id, days, hours, ev.event_key, repeatHours]
      : [ev.organization_id, days, hours, ev.event_key],
  );
  let count = 0;
  for (const r of rows) {
    await dispatchNotification(client, {
      organizationId: ev.organization_id,
      eventKey: ev.event_key,
      recipientUserId: r.user_id,
      recipientEmail: r.email,
      variables: {
        nombre: r.display_name,
        nombre_completo: fullName(r.first_name, r.last_name, r.display_name),
        correo: r.email,
        fecha: r.fecha_fmt,
      },
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

async function fireEventDependency(client: PoolClient, ev: EventRow): Promise<number> {
  if (!ev.trigger_parent_event) return 0;
  const { days, hours } = signedOffset(ev);
  const { rows } = await client.query<{
    user_id: string;
    display_name: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    fire_key: string;
    fecha_fmt: string;
  }>(
    `SELECT n.user_id::text, u.display_name, u.first_name, u.last_name, u.email,
            n.created_at::text AS fire_key,
            to_char(n.created_at, 'DD/MM/YYYY') AS fecha_fmt
       FROM app_core.notifications n
       JOIN app_core.users u ON u.user_id = n.user_id
      WHERE u.organization_id = $1::uuid
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
      variables: {
        nombre: r.display_name,
        nombre_completo: fullName(r.first_name, r.last_name, r.display_name),
        correo: r.email,
        fecha: r.fecha_fmt,
      },
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
