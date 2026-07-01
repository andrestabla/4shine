/**
 * Bulk messaging + delivery history.
 *
 * Permite a admin/gestor enviar un mensaje (email y/o in-app) a un segmento
 * de usuarios filtrado por rol, plan, días restantes de suscripción, etc.
 * También expone el historial paginado de TODAS las notificaciones (manuales
 * y automáticas) con estado de delivery / open / bounce.
 */

import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { withClient } from '@/server/db/pool';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { buildBrandedEmailHtml } from '@/lib/email-template';
import type { AuthUser } from '@/server/auth/types';
import { getTemplate, getNotificationSettingsByOrg, insertUserNotification } from './service';
import { sendEmailToAddress } from './engine';
import type {
  AudiencePage,
  BulkAudienceFilter,
  BulkAudiencePreview,
  BulkRecipientRecord,
  BulkSendInput,
  BulkSendResult,
  ExternalRecipient,
  NotificationHistoryFilter,
  NotificationHistoryPage,
  NotificationHistoryRow,
  NotificationInAppType,
  NotificationDeliveryStatus,
  UserSearchResult,
} from './types';

const ALLOWED_MANAGER_ROLES = new Set(['admin', 'gestor']);

function isAllowedManager(actor: AuthUser): boolean {
  return ALLOWED_MANAGER_ROLES.has(actor.role);
}

function newBatchId(): string {
  // Genera un UUID v4 sin depender de pgcrypto en cada call (más rápido).
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

async function resolveActorOrgId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<{ organization_id: string | null }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1::uuid LIMIT 1`,
    [userId],
  );
  const orgId = rows[0]?.organization_id;
  if (!orgId) {
    throw new Error('El usuario no tiene organización asociada.');
  }
  return orgId;
}

// ─── Audience filtering ──────────────────────────────────────────────────────

interface AudienceQuery {
  whereSql: string;
  params: unknown[];
}

// Un líder cuenta como "con suscripción" con la MISMA definición que usa el
// acceso real de la plataforma (getViewerAccessState → hasProgramSubscription):
//   1) tiene un plan dinámico asignado (user_profiles.subscription_plan_id) que
//      está activo y NO vencido — la fuente de verdad desde el módulo de Planes;
//   2) o conserva un plan_type legacy pagado (premium/vip/empresa_elite) — para
//      líderes aún no migrados al modelo dinámico; o
//   3) tiene una compra activa del grupo 'program'.
// Nota: al asignar un plan dinámico, la migración limpia plan_type a NULL, por
// eso el filtro anterior (solo plan_type IN (...)) marcaba como "sin suscripción"
// a líderes que SÍ tienen plan. Requiere alias `u` (users) y `up` (user_profiles).
const LEADER_HAS_SUBSCRIPTION_SQL = `(
  (
    up.subscription_plan_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM app_billing.subscription_plans sp
      WHERE sp.plan_id = up.subscription_plan_id AND sp.is_active = true
    )
    AND (up.subscription_expires_at IS NULL OR up.subscription_expires_at > now())
  )
  OR up.plan_type IN ('premium', 'vip', 'empresa_elite')
  OR EXISTS (
    SELECT 1
    FROM app_billing.user_purchases pur
    JOIN app_billing.product_catalog pc ON pc.product_code = pur.product_code
    WHERE pur.user_id = u.user_id AND pur.status = 'active' AND pc.product_group = 'program'
  )
)`;

function buildAudienceWhere(filter: BulkAudienceFilter, orgId: string): AudienceQuery {
  const conditions: string[] = ['u.organization_id = $1::uuid'];
  const params: unknown[] = [orgId];

  if (filter.isActive !== undefined) {
    params.push(filter.isActive);
    conditions.push(`u.is_active = $${params.length}`);
  } else {
    conditions.push('u.is_active = true');
  }

  if (filter.userTypes && filter.userTypes.length > 0) {
    const orParts: string[] = [];
    for (const ut of filter.userTypes) {
      switch (ut) {
        case 'leader_with_subscription':
          orParts.push(
            `(u.primary_role = 'lider' AND ${LEADER_HAS_SUBSCRIPTION_SQL})`,
          );
          break;
        case 'leader_without_subscription':
          orParts.push(
            `(u.primary_role = 'lider' AND NOT ${LEADER_HAS_SUBSCRIPTION_SQL})`,
          );
          break;
        case 'mentor':
          orParts.push(`u.primary_role = 'mentor'`);
          break;
        case 'gestor':
          orParts.push(`u.primary_role = 'gestor'`);
          break;
        case 'admin':
          orParts.push(`u.primary_role = 'admin'`);
          break;
        case 'invited':
          orParts.push(`u.primary_role = 'invitado'`);
          break;
      }
    }
    if (orParts.length > 0) {
      conditions.push(`(${orParts.join(' OR ')})`);
    }
  }

  if (filter.planTypes && filter.planTypes.length > 0) {
    params.push(filter.planTypes);
    conditions.push(`up.plan_type = ANY($${params.length}::text[])`);
  }

  if (typeof filter.daysSinceSubscriptionStartMin === 'number') {
    params.push(filter.daysSinceSubscriptionStartMin);
    conditions.push(
      `EXTRACT(EPOCH FROM (now() - up.subscription_started_at)) / 86400 >= $${params.length}`,
    );
  }
  if (typeof filter.daysSinceSubscriptionStartMax === 'number') {
    params.push(filter.daysSinceSubscriptionStartMax);
    conditions.push(
      `EXTRACT(EPOCH FROM (now() - up.subscription_started_at)) / 86400 <= $${params.length}`,
    );
  }

  if (typeof filter.daysUntilExpirationMin === 'number') {
    params.push(filter.daysUntilExpirationMin);
    conditions.push(
      `EXTRACT(EPOCH FROM (up.subscription_expires_at - now())) / 86400 >= $${params.length}`,
    );
  }
  if (typeof filter.daysUntilExpirationMax === 'number') {
    params.push(filter.daysUntilExpirationMax);
    conditions.push(
      `EXTRACT(EPOCH FROM (up.subscription_expires_at - now())) / 86400 <= $${params.length}`,
    );
  }

  if (filter.countries && filter.countries.length > 0) {
    params.push(filter.countries);
    conditions.push(`up.country = ANY($${params.length}::text[])`);
  }

  if (filter.hasAcceptedPolicy === true) {
    conditions.push(`EXISTS (
      SELECT 1 FROM app_auth.user_policy_acceptances pa
      WHERE pa.user_id = u.user_id AND pa.policy_code = 'privacy_policy'
    )`);
  } else if (filter.hasAcceptedPolicy === false) {
    conditions.push(`NOT EXISTS (
      SELECT 1 FROM app_auth.user_policy_acceptances pa
      WHERE pa.user_id = u.user_id AND pa.policy_code = 'privacy_policy'
    )`);
  }

  if (filter.requireEmail) {
    conditions.push(`u.email IS NOT NULL AND length(u.email::text) > 0`);
  }

  return { whereSql: conditions.join(' AND '), params };
}

function deriveUserType(
  role: string,
  hasSubscription: boolean,
): BulkRecipientRecord['userType'] {
  if (role === 'invitado') return 'invited';
  if (role === 'mentor') return 'mentor';
  if (role === 'gestor') return 'gestor';
  if (role === 'admin') return 'admin';
  if (role === 'lider') {
    return hasSubscription
      ? 'leader_with_subscription'
      : 'leader_without_subscription';
  }
  return 'leader_without_subscription';
}

interface AudienceRow {
  user_id: string;
  email: string | null;
  display_name: string;
  primary_role: string;
  plan_type: string | null;
  has_subscription: boolean;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
}

function mapAudienceRow(row: AudienceRow): BulkRecipientRecord {
  const userType = deriveUserType(row.primary_role, row.has_subscription === true);
  const daysUntilExpiration = row.subscription_expires_at
    ? Math.floor(
        (new Date(row.subscription_expires_at).getTime() - Date.now()) / 86_400_000,
      )
    : null;
  const daysSinceSubscriptionStart = row.subscription_started_at
    ? Math.floor(
        (Date.now() - new Date(row.subscription_started_at).getTime()) / 86_400_000,
      )
    : null;
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    primaryRole: row.primary_role as BulkRecipientRecord['primaryRole'],
    userType,
    planType: (row.plan_type ?? null) as BulkRecipientRecord['planType'],
    daysUntilExpiration,
    daysSinceSubscriptionStart,
  };
}

export async function previewBulkAudience(
  client: PoolClient,
  actor: AuthUser,
  filter: BulkAudienceFilter,
): Promise<BulkAudiencePreview> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (!isAllowedManager(actor)) {
    throw new Error('Solo admin y gestor pueden segmentar usuarios.');
  }
  const orgId = await resolveActorOrgId(client, actor.userId);
  const { whereSql, params } = buildAudienceWhere(filter, orgId);

  const totalResult = await client.query<{
    total: string;
    with_email: string;
    without_email: string;
  }>(
    `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE u.email IS NOT NULL AND length(u.email::text) > 0) AS with_email,
        COUNT(*) FILTER (WHERE u.email IS NULL OR length(u.email::text) = 0) AS without_email
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE ${whereSql}
    `,
    params,
  );

  const total = Number(totalResult.rows[0]?.total ?? 0);
  const withEmail = Number(totalResult.rows[0]?.with_email ?? 0);
  const withoutEmail = Number(totalResult.rows[0]?.without_email ?? 0);

  const sampleResult = await client.query<AudienceRow>(
    `
      SELECT
        u.user_id::text,
        u.email::text,
        u.display_name,
        u.primary_role,
        up.plan_type,
        ${LEADER_HAS_SUBSCRIPTION_SQL} AS has_subscription,
        up.subscription_started_at::text,
        up.subscription_expires_at::text
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE ${whereSql}
      ORDER BY u.display_name
      LIMIT 20
    `,
    params,
  );

  return {
    totalMatching: total,
    withEmail,
    withoutEmail,
    sample: sampleResult.rows.map(mapAudienceRow),
  };
}

async function listAllRecipients(
  client: PoolClient,
  filter: BulkAudienceFilter,
  orgId: string,
): Promise<BulkRecipientRecord[]> {
  const { whereSql, params } = buildAudienceWhere(filter, orgId);
  const { rows } = await client.query<AudienceRow>(
    `
      SELECT
        u.user_id::text,
        u.email::text,
        u.display_name,
        u.primary_role,
        up.plan_type,
        ${LEADER_HAS_SUBSCRIPTION_SQL} AS has_subscription,
        up.subscription_started_at::text,
        up.subscription_expires_at::text
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE ${whereSql}
      ORDER BY u.display_name
      LIMIT 5000
    `,
    params,
  );
  return rows.map(mapAudienceRow);
}

// ─── Audience list (paginated, editable) + user search ────────────────────────

export async function listAudience(
  client: PoolClient,
  actor: AuthUser,
  filter: BulkAudienceFilter,
  pagination: { limit?: number; offset?: number } = {},
): Promise<AudiencePage> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (!isAllowedManager(actor)) {
    throw new Error('Solo admin y gestor pueden segmentar usuarios.');
  }
  const orgId = await resolveActorOrgId(client, actor.userId);
  const { whereSql, params } = buildAudienceWhere(filter, orgId);

  const limit = Math.min(Math.max(pagination.limit ?? 200, 1), 1000);
  const offset = Math.max(pagination.offset ?? 0, 0);

  const totalResult = await client.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE ${whereSql}
    `,
    params,
  );

  const queryParams = [...params, limit, offset];
  const rowsResult = await client.query<AudienceRow>(
    `
      SELECT
        u.user_id::text,
        u.email::text,
        u.display_name,
        u.primary_role,
        up.plan_type,
        ${LEADER_HAS_SUBSCRIPTION_SQL} AS has_subscription,
        up.subscription_started_at::text,
        up.subscription_expires_at::text
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE ${whereSql}
      ORDER BY u.display_name
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `,
    queryParams,
  );

  return {
    rows: rowsResult.rows.map(mapAudienceRow),
    total: Number(totalResult.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

export async function searchPlatformUsers(
  client: PoolClient,
  actor: AuthUser,
  query: string,
  limit = 20,
): Promise<UserSearchResult[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (!isAllowedManager(actor)) {
    throw new Error('Solo admin y gestor pueden buscar usuarios.');
  }
  const orgId = await resolveActorOrgId(client, actor.userId);
  const q = `%${query.trim().toLowerCase()}%`;
  if (!q || q === '%%') return [];

  const { rows } = await client.query<AudienceRow>(
    `
      SELECT
        u.user_id::text,
        u.email::text,
        u.display_name,
        u.primary_role,
        up.plan_type,
        ${LEADER_HAS_SUBSCRIPTION_SQL} AS has_subscription,
        NULL::text AS subscription_started_at,
        NULL::text AS subscription_expires_at
      FROM app_core.users u
      LEFT JOIN app_core.user_profiles up ON up.user_id = u.user_id
      WHERE u.organization_id = $1::uuid
        AND u.is_active = true
        AND (
          LOWER(u.display_name) LIKE $2
          OR LOWER(u.email::text) LIKE $2
        )
      ORDER BY u.display_name
      LIMIT $3
    `,
    [orgId, q, Math.min(Math.max(limit, 1), 50)],
  );

  return rows.map((row) => {
    const r = mapAudienceRow(row);
    return {
      userId: r.userId,
      email: r.email,
      displayName: r.displayName,
      primaryRole: r.primaryRole,
      userType: r.userType,
    };
  });
}

// ─── Bulk send ───────────────────────────────────────────────────────────────

function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

interface ResolvedRecipient {
  userId: string | null;
  email: string | null;
  displayName: string;
}

async function resolveSendRecipients(
  client: PoolClient,
  orgId: string,
  input: BulkSendInput,
): Promise<ResolvedRecipient[]> {
  const out: ResolvedRecipient[] = [];

  // 1. Filtro completo (legacy / "enviar a toda la audiencia").
  if (input.filter && (!input.recipientUserIds || input.recipientUserIds.length === 0)) {
    const all = await listAllRecipients(client, input.filter, orgId);
    for (const r of all) {
      out.push({ userId: r.userId, email: r.email, displayName: r.displayName });
    }
  }

  // 2. UserIds explícitos.
  if (input.recipientUserIds && input.recipientUserIds.length > 0) {
    const { rows } = await client.query<{
      user_id: string;
      email: string | null;
      display_name: string;
    }>(
      `SELECT u.user_id::text, u.email::text, u.display_name
       FROM app_core.users u
       WHERE u.organization_id = $1::uuid
         AND u.user_id = ANY($2::uuid[])
         AND u.is_active = true`,
      [orgId, input.recipientUserIds],
    );
    for (const row of rows) {
      out.push({
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
      });
    }
  }

  // 3. Destinatarios externos (sin cuenta).
  if (input.externalRecipients && input.externalRecipients.length > 0) {
    for (const ext of input.externalRecipients) {
      const email = (ext.email ?? '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      out.push({
        userId: null,
        email,
        displayName: ext.name?.trim() || email.split('@')[0] || 'Destinatario',
      });
    }
  }

  // Dedup por (userId || email)
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = r.userId ?? `ext:${r.email}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function sendBulkMessage(
  client: PoolClient,
  actor: AuthUser,
  input: BulkSendInput,
): Promise<BulkSendResult> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (!isAllowedManager(actor)) {
    throw new Error('Solo admin y gestor pueden enviar mensajes masivos.');
  }
  if (input.channels.length === 0) {
    throw new Error('Selecciona al menos un canal (email o in-app).');
  }
  if (!input.templateId && !input.custom) {
    throw new Error('Selecciona una plantilla o redacta el mensaje manualmente.');
  }

  const orgId = await resolveActorOrgId(client, actor.userId);

  // Resolve content base: template OR custom
  let baseSubject = '';
  let baseHtml = '';
  let baseText = '';
  let baseInAppTitle = '';
  let baseInAppBody = '';
  let baseInAppType: NotificationInAppType = 'info';
  let baseActionUrl = '';
  let eventKey: string | null = null;

  if (input.templateId) {
    const tpl = await getTemplate(client, actor, input.templateId);
    if (!tpl) throw new Error('Plantilla no encontrada.');
    if (!tpl.isActive) throw new Error('La plantilla seleccionada está inactiva.');
    baseSubject = tpl.subjectTemplate;
    baseHtml = tpl.bodyHtmlTemplate;
    baseText = tpl.bodyTextTemplate;
    baseInAppTitle = tpl.inAppTitleTemplate;
    baseInAppBody = tpl.inAppBodyTemplate;
    baseInAppType = tpl.inAppType;
    baseActionUrl = tpl.inAppActionUrlTemplate;
    eventKey = tpl.eventKey;
  } else if (input.custom) {
    baseSubject = input.custom.subject;
    baseHtml = input.custom.bodyHtml;
    baseText = input.custom.bodyText;
    baseInAppTitle = input.custom.inAppTitle;
    baseInAppBody = input.custom.inAppBody;
    baseInAppType = input.custom.inAppType ?? 'info';
    baseActionUrl = input.custom.inAppActionUrl ?? '';
    eventKey = 'broadcast.custom';
  }

  const globalSettings = await getNotificationSettingsByOrg(client, orgId);
  const baseVars: Record<string, string> = {
    plataforma: globalSettings.varPlatformName || '4Shine',
    enlace_plataforma: globalSettings.varPlatformUrl || 'https://www.4shine.co',
    ...(input.variables ?? {}),
  };

  const recipients = await resolveSendRecipients(client, orgId, input);
  if (recipients.length === 0) {
    throw new Error('No hay destinatarios resueltos. Marca usuarios o agrega emails externos.');
  }
  const batchId = newBatchId();

  const result: BulkSendResult = {
    batchId,
    totalRecipients: recipients.length,
    inAppCreated: 0,
    emailsQueued: 0,
    emailsFailed: 0,
    errors: [],
  };

  const wantEmail = input.channels.includes('email');
  const wantInApp = input.channels.includes('in_app');

  for (const r of recipients) {
    const vars = {
      ...baseVars,
      nombre: r.displayName?.split(' ')[0] ?? 'Líder',
      nombre_completo: r.displayName,
    };
    const recipientKey = r.userId ?? r.email ?? 'unknown';

    // ── In-app ───────────────────────────────────────────────────────────
    // Solo aplicable a usuarios de la plataforma (los externos solo email).
    if (wantInApp && r.userId) {
      try {
        const title = renderTemplate(baseInAppTitle || baseSubject, vars);
        const body = renderTemplate(baseInAppBody || baseText, vars);
        const actionUrl = baseActionUrl ? renderTemplate(baseActionUrl, vars) : undefined;
        await insertUserNotification(client, {
          organizationId: orgId,
          userId: r.userId,
          type: baseInAppType,
          title,
          message: body,
          eventKey: eventKey ?? 'broadcast.custom',
          actionUrl,
          senderUserId: actor.userId,
          batchId,
          channel: 'in_app',
        });
        result.inAppCreated++;
      } catch (error) {
        result.errors.push({
          userId: recipientKey,
          error: error instanceof Error ? error.message : 'Error in-app desconocido',
        });
      }
    }

    // ── Email ────────────────────────────────────────────────────────────
    if (wantEmail) {
      if (!r.email) continue;
      try {
        const subject = renderTemplate(baseSubject, vars);
        const html = renderTemplate(baseHtml, vars);
        const text = renderTemplate(baseText, vars);
        const providerMessageId = await sendEmailToAddress(
          client,
          orgId,
          r.email,
          subject,
          html,
          text,
          { listUnsubscribe: true },
        );

        // Registra el envío de email en notifications para que aparezca en historial.
        // delivered_at quedará NULL hasta que SES webhook reporte Delivery.
        await insertUserNotification(client, {
          organizationId: orgId,
          userId: r.userId, // puede ser null (destinatario externo)
          type: baseInAppType,
          title: subject,
          message: text || stripHtml(html),
          eventKey: eventKey ?? 'broadcast.custom',
          actionUrl: baseActionUrl ? renderTemplate(baseActionUrl, vars) : undefined,
          payload: {
            channel: 'email',
            html_snapshot: html,
            text_snapshot: text,
            recipient_display_name: r.displayName,
            is_external: !r.userId,
          },
          senderUserId: actor.userId,
          batchId,
          channel: 'email',
          recipientEmail: r.email,
          providerMessageId: providerMessageId ?? null,
          deliveredAt: null,
        });
        result.emailsQueued++;
      } catch (error) {
        result.emailsFailed++;
        result.errors.push({
          userId: recipientKey,
          error: error instanceof Error ? error.message : 'Error email desconocido',
        });
      }
    }
  }

  // Audit log
  await client.query(
    `INSERT INTO app_admin.audit_logs
       (actor_user_id, action, module_code, entity_table, entity_id, change_summary)
     VALUES ($1::uuid, 'broadcast_message_sent', 'usuarios', 'app_core.notifications', NULL,
             jsonb_build_object(
               'batch_id', $2::text,
               'total', $3::int,
               'in_app', $4::int,
               'emails_queued', $5::int,
               'emails_failed', $6::int,
               'channels', $7::text[],
               'template_id', $8::text
             ))`,
    [
      actor.userId,
      batchId,
      result.totalRecipients,
      result.inAppCreated,
      result.emailsQueued,
      result.emailsFailed,
      input.channels,
      input.templateId ?? null,
    ],
  );

  return result;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── History ─────────────────────────────────────────────────────────────────

interface HistoryRow {
  notification_id: string;
  batch_id: string | null;
  channel: 'email' | 'in_app';
  event_key: string | null;
  title: string;
  message: string;
  notification_type: NotificationInAppType;
  action_url: string | null;
  payload: Record<string, unknown> | null;

  sender_user_id: string | null;
  sender_name: string | null;
  recipient_user_id: string | null;
  recipient_name: string;
  recipient_email: string | null;

  created_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  read_at: string | null;
  bounced_at: string | null;
  complaint_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
}

function deriveStatus(row: HistoryRow): NotificationDeliveryStatus {
  if (row.failed_at) return 'failed';
  if (row.bounced_at) return 'bounced';
  if (row.complaint_at) return 'complaint';
  if (row.opened_at || row.read_at) return 'opened';
  if (row.delivered_at) return 'delivered';
  return 'sent';
}

function mapHistoryRow(row: HistoryRow): NotificationHistoryRow {
  const payload = (row.payload ?? {}) as Record<string, unknown>;
  return {
    notificationId: row.notification_id,
    batchId: row.batch_id,
    channel: row.channel,
    eventKey: row.event_key,
    title: row.title,
    message: row.message,
    bodyHtmlSnapshot:
      typeof payload.html_snapshot === 'string' ? (payload.html_snapshot as string) : null,
    bodyTextSnapshot:
      typeof payload.text_snapshot === 'string' ? (payload.text_snapshot as string) : null,
    inAppType: row.notification_type,
    actionUrl: row.action_url,

    senderUserId: row.sender_user_id,
    senderName: row.sender_name,
    recipientUserId: row.recipient_user_id,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,

    createdAt: row.created_at,
    deliveredAt: row.delivered_at,
    openedAt: row.opened_at ?? row.read_at,
    bouncedAt: row.bounced_at,
    complaintAt: row.complaint_at,
    failedAt: row.failed_at,
    failureReason: row.failure_reason,

    status: deriveStatus(row),
  };
}

export async function listNotificationHistory(
  client: PoolClient,
  actor: AuthUser,
  filter: NotificationHistoryFilter = {},
): Promise<NotificationHistoryPage> {
  await requireModulePermission(client, 'usuarios', 'manage');
  if (!isAllowedManager(actor)) {
    throw new Error('Solo admin y gestor pueden ver el historial.');
  }

  const orgId = await resolveActorOrgId(client, actor.userId);
  const limit = Math.min(Math.max(filter.limit ?? 50, 1), 200);
  const offset = Math.max(filter.offset ?? 0, 0);

  // Incluye notificaciones de la org (por recipient) y notificaciones a
  // destinatarios externos enviadas por usuarios de la org (por sender).
  const conditions: string[] = [
    '(recipient.organization_id = $1::uuid OR sender.organization_id = $1::uuid)',
  ];
  const params: unknown[] = [orgId];

  if (filter.channel) {
    params.push(filter.channel);
    conditions.push(`n.channel = $${params.length}`);
  }

  if (filter.source === 'manual') {
    conditions.push('n.sender_user_id IS NOT NULL');
  } else if (filter.source === 'automatic') {
    conditions.push('n.sender_user_id IS NULL');
  }

  if (filter.status) {
    switch (filter.status) {
      case 'sent':
        conditions.push('n.delivered_at IS NULL AND n.failed_at IS NULL AND n.bounced_at IS NULL');
        break;
      case 'delivered':
        conditions.push('n.delivered_at IS NOT NULL AND n.opened_at IS NULL AND n.read_at IS NULL');
        break;
      case 'opened':
        conditions.push('(n.opened_at IS NOT NULL OR n.read_at IS NOT NULL)');
        break;
      case 'bounced':
        conditions.push('n.bounced_at IS NOT NULL');
        break;
      case 'complaint':
        conditions.push('n.complaint_at IS NOT NULL');
        break;
      case 'failed':
        conditions.push('n.failed_at IS NOT NULL');
        break;
    }
  }

  if (filter.senderUserId) {
    params.push(filter.senderUserId);
    conditions.push(`n.sender_user_id = $${params.length}::uuid`);
  }

  if (filter.recipientSearch && filter.recipientSearch.trim()) {
    const pattern = `%${filter.recipientSearch.trim().toLowerCase()}%`;
    params.push(pattern);
    conditions.push(
      `(LOWER(COALESCE(recipient.display_name, '')) LIKE $${params.length} OR LOWER(COALESCE(recipient.email::text, '')) LIKE $${params.length} OR LOWER(COALESCE(n.recipient_email, '')) LIKE $${params.length})`,
    );
  }

  if (filter.fromDate) {
    params.push(filter.fromDate);
    conditions.push(`n.created_at >= $${params.length}::timestamptz`);
  }
  if (filter.toDate) {
    params.push(filter.toDate);
    conditions.push(`n.created_at <= $${params.length}::timestamptz`);
  }

  const whereSql = conditions.join(' AND ');

  const totalResult = await client.query<{ total: string }>(
    `
      SELECT COUNT(*) AS total
      FROM app_core.notifications n
      LEFT JOIN app_core.users recipient ON recipient.user_id = n.user_id
      LEFT JOIN app_core.users sender ON sender.user_id = n.sender_user_id
      WHERE ${whereSql}
    `,
    params,
  );

  params.push(limit, offset);

  const rowsResult = await client.query<HistoryRow>(
    `
      SELECT
        n.notification_id::text,
        n.batch_id::text,
        n.channel,
        n.event_key,
        n.title,
        n.message,
        n.notification_type,
        n.action_url,
        n.payload,
        n.sender_user_id::text,
        sender.display_name AS sender_name,
        n.user_id::text AS recipient_user_id,
        COALESCE(
          recipient.display_name,
          NULLIF(n.payload->>'recipient_display_name', ''),
          n.recipient_email,
          'Destinatario externo'
        ) AS recipient_name,
        COALESCE(n.recipient_email, recipient.email::text) AS recipient_email,
        n.created_at::text,
        n.delivered_at::text,
        n.opened_at::text,
        n.read_at::text,
        n.bounced_at::text,
        n.complaint_at::text,
        n.failed_at::text,
        n.failure_reason
      FROM app_core.notifications n
      LEFT JOIN app_core.users recipient ON recipient.user_id = n.user_id
      LEFT JOIN app_core.users sender ON sender.user_id = n.sender_user_id
      WHERE ${whereSql}
      ORDER BY n.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params,
  );

  return {
    rows: rowsResult.rows.map(mapHistoryRow),
    total: Number(totalResult.rows[0]?.total ?? 0),
    limit,
    offset,
  };
}

// ─── Webhook handler (called by SES via SNS) ─────────────────────────────────

/**
 * Aplica un evento SES (Delivery, Open, Bounce, Complaint) a la notificación
 * correspondiente, buscándola por provider_message_id.
 * Devuelve la cantidad de filas actualizadas (0 si no se encontró match).
 */
export async function applySesEvent(
  messageId: string,
  event:
    | { type: 'delivery' }
    | { type: 'open' }
    | { type: 'bounce'; reason?: string }
    | { type: 'complaint'; reason?: string }
    | { type: 'reject'; reason?: string },
): Promise<number> {
  return await withClient(async (client) => {
    await client.query('SELECT set_config($1, $2, true)', ['app.current_role', 'gestor']);

    let column = '';
    let extraReason: string | null = null;
    switch (event.type) {
      case 'delivery':
        column = 'delivered_at';
        break;
      case 'open':
        column = 'opened_at';
        break;
      case 'bounce':
        column = 'bounced_at';
        extraReason = event.reason ?? 'bounce';
        break;
      case 'complaint':
        column = 'complaint_at';
        extraReason = event.reason ?? 'complaint';
        break;
      case 'reject':
        column = 'failed_at';
        extraReason = event.reason ?? 'rejected by SES';
        break;
    }

    const updateExtra = extraReason
      ? `, failure_reason = COALESCE(failure_reason, $2)`
      : '';
    const params: unknown[] = [messageId];
    if (extraReason) params.push(extraReason);

    const result = await client.query(
      `UPDATE app_core.notifications
       SET ${column} = COALESCE(${column}, now())${updateExtra}
       WHERE provider_message_id = $1`,
      params,
    );
    return result.rowCount ?? 0;
  });
}
