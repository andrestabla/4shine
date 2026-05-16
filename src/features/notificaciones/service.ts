import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import type {
  NotificationTemplateRecord,
  NotificationEventConfigRecord,
  CreateTemplateInput,
  UpdateTemplateInput,
  UpdateEventConfigInput,
  NotificationInAppType,
  NotificationGlobalSettings,
} from './types';

// ─── Internal row types ───────────────────────────────────────────────────────

interface TemplateRow {
  template_id: string;
  organization_id: string;
  name: string;
  description: string;
  event_key: string;
  module_code: string;
  channel_email: boolean;
  channel_in_app: boolean;
  subject_template: string;
  body_html_template: string;
  body_text_template: string;
  in_app_title_template: string;
  in_app_body_template: string;
  in_app_type: NotificationInAppType;
  in_app_action_url_template: string;
  is_active: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface EventConfigRow {
  config_id: string;
  organization_id: string;
  event_key: string;
  module_code: string;
  template_id: string | null;
  channel_email: boolean;
  channel_in_app: boolean;
  is_enabled: boolean;
  updated_at: string;
}

// ─── Org resolution ───────────────────────────────────────────────────────────

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

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toTemplateRecord(row: TemplateRow): NotificationTemplateRecord {
  return {
    templateId: row.template_id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    eventKey: row.event_key,
    moduleCode: row.module_code,
    channelEmail: row.channel_email,
    channelInApp: row.channel_in_app,
    subjectTemplate: row.subject_template,
    bodyHtmlTemplate: row.body_html_template,
    bodyTextTemplate: row.body_text_template,
    inAppTitleTemplate: row.in_app_title_template,
    inAppBodyTemplate: row.in_app_body_template,
    inAppType: row.in_app_type,
    inAppActionUrlTemplate: row.in_app_action_url_template,
    isActive: row.is_active,
    isSystem: row.is_system,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEventConfigRecord(row: EventConfigRow): NotificationEventConfigRecord {
  return {
    configId: row.config_id,
    organizationId: row.organization_id,
    eventKey: row.event_key,
    moduleCode: row.module_code,
    templateId: row.template_id,
    channelEmail: row.channel_email,
    channelInApp: row.channel_in_app,
    isEnabled: row.is_enabled,
    updatedAt: row.updated_at,
  };
}

const TEMPLATE_SELECT = `
  template_id::text, organization_id::text, name, description, event_key, module_code,
  channel_email, channel_in_app, subject_template, body_html_template, body_text_template,
  in_app_title_template, in_app_body_template, in_app_type, in_app_action_url_template,
  is_active, is_system, created_by::text, created_at::text, updated_at::text
`;

// ─── Template CRUD ────────────────────────────────────────────────────────────

export async function listTemplates(
  client: PoolClient,
  actor: AuthUser,
): Promise<NotificationTemplateRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows } = await client.query<TemplateRow>(
    `SELECT ${TEMPLATE_SELECT}
     FROM app_admin.notification_templates
     WHERE organization_id = $1
     ORDER BY module_code, name`,
    [orgId],
  );
  return rows.map(toTemplateRecord);
}

export async function getTemplate(
  client: PoolClient,
  actor: AuthUser,
  templateId: string,
): Promise<NotificationTemplateRecord | null> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows } = await client.query<TemplateRow>(
    `SELECT ${TEMPLATE_SELECT}
     FROM app_admin.notification_templates
     WHERE organization_id = $1 AND template_id = $2
     LIMIT 1`,
    [orgId, templateId],
  );
  return rows[0] ? toTemplateRecord(rows[0]) : null;
}

export async function createTemplate(
  client: PoolClient,
  actor: AuthUser,
  input: CreateTemplateInput,
): Promise<NotificationTemplateRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows } = await client.query<TemplateRow>(
    `INSERT INTO app_admin.notification_templates
       (organization_id, name, description, event_key, module_code,
        channel_email, channel_in_app, subject_template, body_html_template, body_text_template,
        in_app_title_template, in_app_body_template, in_app_type, in_app_action_url_template,
        is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING ${TEMPLATE_SELECT}`,
    [
      orgId,
      input.name.trim(),
      input.description?.trim() ?? '',
      input.eventKey,
      input.moduleCode,
      input.channelEmail ?? true,
      input.channelInApp ?? true,
      input.subjectTemplate ?? '',
      input.bodyHtmlTemplate ?? '',
      input.bodyTextTemplate ?? '',
      input.inAppTitleTemplate ?? '',
      input.inAppBodyTemplate ?? '',
      input.inAppType ?? 'info',
      input.inAppActionUrlTemplate ?? '',
      input.isActive ?? true,
      actor.userId,
    ],
  );
  return toTemplateRecord(rows[0]);
}

export async function updateTemplate(
  client: PoolClient,
  actor: AuthUser,
  templateId: string,
  input: UpdateTemplateInput,
): Promise<NotificationTemplateRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows: existing } = await client.query<{ is_system: boolean }>(
    `SELECT is_system FROM app_admin.notification_templates
     WHERE organization_id = $1 AND template_id = $2 LIMIT 1`,
    [orgId, templateId],
  );
  if (!existing[0]) throw new Error('Plantilla no encontrada');

  const setClauses: string[] = ['updated_at = now()'];
  const params: unknown[] = [orgId, templateId];
  let idx = 3;

  const fields: [string, unknown][] = [
    ['name', input.name !== undefined ? input.name.trim() : undefined],
    ['description', input.description],
    ['channel_email', input.channelEmail],
    ['channel_in_app', input.channelInApp],
    ['subject_template', input.subjectTemplate],
    ['body_html_template', input.bodyHtmlTemplate],
    ['body_text_template', input.bodyTextTemplate],
    ['in_app_title_template', input.inAppTitleTemplate],
    ['in_app_body_template', input.inAppBodyTemplate],
    ['in_app_type', input.inAppType],
    ['in_app_action_url_template', input.inAppActionUrlTemplate],
    ['is_active', input.isActive],
  ];

  for (const [col, val] of fields) {
    if (val !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(val);
    }
  }

  const { rows } = await client.query<TemplateRow>(
    `UPDATE app_admin.notification_templates
     SET ${setClauses.join(', ')}
     WHERE organization_id = $1 AND template_id = $2
     RETURNING ${TEMPLATE_SELECT}`,
    params,
  );
  return toTemplateRecord(rows[0]);
}

export async function deleteTemplate(
  client: PoolClient,
  actor: AuthUser,
  templateId: string,
): Promise<void> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows } = await client.query<{ is_system: boolean }>(
    `SELECT is_system FROM app_admin.notification_templates
     WHERE organization_id = $1 AND template_id = $2 LIMIT 1`,
    [orgId, templateId],
  );
  if (!rows[0]) throw new Error('Plantilla no encontrada');
  if (rows[0].is_system) throw new Error('No se puede eliminar una plantilla del sistema');

  await client.query(
    `DELETE FROM app_admin.notification_templates WHERE organization_id = $1 AND template_id = $2`,
    [orgId, templateId],
  );
}

// ─── Event Configurations ─────────────────────────────────────────────────────

export async function listEventConfigs(
  client: PoolClient,
  actor: AuthUser,
): Promise<NotificationEventConfigRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows } = await client.query<EventConfigRow>(
    `SELECT config_id::text, organization_id::text, event_key, module_code,
            template_id::text, channel_email, channel_in_app, is_enabled, updated_at::text
     FROM app_admin.notification_event_configs
     WHERE organization_id = $1
     ORDER BY module_code, event_key`,
    [orgId],
  );
  return rows.map(toEventConfigRecord);
}

export async function upsertEventConfig(
  client: PoolClient,
  actor: AuthUser,
  eventKey: string,
  moduleCode: string,
  input: UpdateEventConfigInput,
): Promise<NotificationEventConfigRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);

  const { rows } = await client.query<EventConfigRow>(
    `INSERT INTO app_admin.notification_event_configs
       (organization_id, event_key, module_code, template_id, channel_email, channel_in_app, is_enabled, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (organization_id, event_key) DO UPDATE SET
       template_id    = EXCLUDED.template_id,
       channel_email  = EXCLUDED.channel_email,
       channel_in_app = EXCLUDED.channel_in_app,
       is_enabled     = EXCLUDED.is_enabled,
       updated_by     = EXCLUDED.updated_by,
       updated_at     = now()
     RETURNING
       config_id::text, organization_id::text, event_key, module_code,
       template_id::text, channel_email, channel_in_app, is_enabled, updated_at::text`,
    [
      orgId,
      eventKey,
      moduleCode,
      input.templateId ?? null,
      input.channelEmail ?? true,
      input.channelInApp ?? true,
      input.isEnabled ?? true,
      actor.userId,
    ],
  );
  return toEventConfigRecord(rows[0]);
}

// ─── In-app notification creation (called by engine) ─────────────────────────

export async function insertUserNotification(
  client: PoolClient,
  params: {
    organizationId: string;
    userId: string;
    type: NotificationInAppType;
    title: string;
    message: string;
    eventKey: string;
    actionUrl?: string;
    payload?: Record<string, unknown>;
  },
): Promise<string> {
  const { rows } = await client.query<{ notification_id: string }>(
    `INSERT INTO app_core.notifications
       (user_id, notification_type, title, message, payload, event_key, action_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING notification_id::text`,
    [
      params.userId,
      params.type,
      params.title,
      params.message,
      JSON.stringify(params.payload ?? {}),
      params.eventKey,
      params.actionUrl ?? null,
    ],
  );
  return rows[0].notification_id;
}

// ─── Resolve active template for an event (used by engine) ───────────────────

export async function resolveEventConfig(
  client: PoolClient,
  organizationId: string,
  eventKey: string,
): Promise<{
  isEnabled: boolean;
  channelEmail: boolean;
  channelInApp: boolean;
  template: NotificationTemplateRecord | null;
}> {
  const { rows: configRows } = await client.query<EventConfigRow>(
    `SELECT config_id::text, organization_id::text, event_key, module_code,
            template_id::text, channel_email, channel_in_app, is_enabled, updated_at::text
     FROM app_admin.notification_event_configs
     WHERE organization_id = $1 AND event_key = $2 LIMIT 1`,
    [organizationId, eventKey],
  );

  const config = configRows[0];
  if (!config || !config.is_enabled) {
    return { isEnabled: false, channelEmail: false, channelInApp: false, template: null };
  }

  let template: NotificationTemplateRecord | null = null;
  if (config.template_id) {
    const { rows: tmplRows } = await client.query<TemplateRow>(
      `SELECT ${TEMPLATE_SELECT}
       FROM app_admin.notification_templates
       WHERE template_id = $1 AND is_active = true LIMIT 1`,
      [config.template_id],
    );
    template = tmplRows[0] ? toTemplateRecord(tmplRows[0]) : null;
  }

  return {
    isEnabled: config.is_enabled,
    channelEmail: config.channel_email,
    channelInApp: config.channel_in_app,
    template,
  };
}

// ─── Global Settings ─────────────────────────────────────────────────────────

interface GlobalSettingsRow {
  var_platform_name: string;
  var_platform_url: string;
  email_header_bg: string;
  email_footer_tagline: string;
  email_footer_support: string;
  email_footer_legal: string;
}

function toGlobalSettings(row: GlobalSettingsRow | undefined): NotificationGlobalSettings {
  return {
    varPlatformName: row?.var_platform_name ?? '',
    varPlatformUrl: row?.var_platform_url ?? '',
    emailHeaderBg: row?.email_header_bg ?? '#1e293b',
    emailFooterTagline: row?.email_footer_tagline ?? '',
    emailFooterSupport: row?.email_footer_support ?? '',
    emailFooterLegal: row?.email_footer_legal ?? '',
  };
}

const GLOBAL_SETTINGS_SELECT = `
  var_platform_name, var_platform_url, email_header_bg,
  email_footer_tagline, email_footer_support, email_footer_legal
`;

export async function getNotificationSettings(
  client: PoolClient,
  actor: AuthUser,
): Promise<NotificationGlobalSettings> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<GlobalSettingsRow>(
    `SELECT ${GLOBAL_SETTINGS_SELECT}
     FROM app_admin.notification_global_settings
     WHERE organization_id = $1 LIMIT 1`,
    [orgId],
  );
  return toGlobalSettings(rows[0]);
}

export async function upsertNotificationSettings(
  client: PoolClient,
  actor: AuthUser,
  input: NotificationGlobalSettings,
): Promise<NotificationGlobalSettings> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  const { rows } = await client.query<GlobalSettingsRow>(
    `INSERT INTO app_admin.notification_global_settings
       (organization_id, var_platform_name, var_platform_url, email_header_bg,
        email_footer_tagline, email_footer_support, email_footer_legal)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (organization_id) DO UPDATE SET
       var_platform_name    = EXCLUDED.var_platform_name,
       var_platform_url     = EXCLUDED.var_platform_url,
       email_header_bg      = EXCLUDED.email_header_bg,
       email_footer_tagline = EXCLUDED.email_footer_tagline,
       email_footer_support = EXCLUDED.email_footer_support,
       email_footer_legal   = EXCLUDED.email_footer_legal,
       updated_at           = NOW()
     RETURNING ${GLOBAL_SETTINGS_SELECT}`,
    [
      orgId,
      input.varPlatformName.trim(),
      input.varPlatformUrl.trim(),
      input.emailHeaderBg.trim() || '#1e293b',
      input.emailFooterTagline.trim(),
      input.emailFooterSupport.trim(),
      input.emailFooterLegal.trim(),
    ],
  );
  return toGlobalSettings(rows[0]);
}

export async function getNotificationSettingsByOrg(
  client: PoolClient,
  organizationId: string,
): Promise<NotificationGlobalSettings> {
  const { rows } = await client.query<GlobalSettingsRow>(
    `SELECT ${GLOBAL_SETTINGS_SELECT}
     FROM app_admin.notification_global_settings
     WHERE organization_id = $1 LIMIT 1`,
    [organizationId],
  );
  return toGlobalSettings(rows[0]);
}
