import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import type {
  PublicAssistantSettings,
  PublicAssistantOption,
  PublicAssistantConfig,
  UpdatePublicAssistantInput,
} from './types';

interface Row {
  organization_id: string;
  is_enabled: boolean;
  assistant_name: string;
  avatar_url: string;
  greeting: string;
  intro: string;
  whatsapp_number: string;
  whatsapp_intro: string;
  options: unknown;
  updated_at: string;
}

const SELECT = `
  organization_id::text, is_enabled, assistant_name, avatar_url, greeting, intro,
  whatsapp_number, whatsapp_intro, options, updated_at::text
`;

function sanitizeOptions(value: unknown): PublicAssistantOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((o) => ({
      label: typeof (o as PublicAssistantOption)?.label === 'string' ? (o as PublicAssistantOption).label : '',
      message: typeof (o as PublicAssistantOption)?.message === 'string' ? (o as PublicAssistantOption).message : '',
    }))
    .filter((o) => o.label.trim().length > 0);
}

function toSettings(row: Row): PublicAssistantSettings {
  return {
    organizationId: row.organization_id,
    isEnabled: row.is_enabled,
    assistantName: row.assistant_name,
    avatarUrl: row.avatar_url,
    greeting: row.greeting,
    intro: row.intro,
    whatsappNumber: row.whatsapp_number,
    whatsappIntro: row.whatsapp_intro,
    options: sanitizeOptions(row.options),
    updatedAt: row.updated_at,
  };
}

async function resolveOrgId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1 LIMIT 1`,
    [userId],
  );
  if (rows[0]?.organization_id) return rows[0].organization_id;
  const { rows: fb } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.organizations ORDER BY created_at ASC LIMIT 1`,
  );
  if (fb[0]?.organization_id) return fb[0].organization_id;
  throw new Error('Organization not found');
}

async function loadOrCreate(client: PoolClient, orgId: string): Promise<Row> {
  const { rows } = await client.query<Row>(
    `SELECT ${SELECT} FROM app_admin.public_assistant_settings WHERE organization_id = $1 LIMIT 1`,
    [orgId],
  );
  if (rows[0]) return rows[0];
  const { rows: created } = await client.query<Row>(
    `INSERT INTO app_admin.public_assistant_settings (organization_id)
     VALUES ($1)
     ON CONFLICT (organization_id) DO UPDATE SET organization_id = EXCLUDED.organization_id
     RETURNING ${SELECT}`,
    [orgId],
  );
  return created[0];
}

export async function getPublicAssistantSettings(
  client: PoolClient,
  actor: AuthUser,
): Promise<PublicAssistantSettings> {
  await requireModulePermission(client, 'usuarios', 'view');
  const orgId = await resolveOrgId(client, actor.userId);
  return toSettings(await loadOrCreate(client, orgId));
}

export async function updatePublicAssistantSettings(
  client: PoolClient,
  actor: AuthUser,
  input: UpdatePublicAssistantInput,
): Promise<PublicAssistantSettings> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const orgId = await resolveOrgId(client, actor.userId);
  await loadOrCreate(client, orgId);

  const fields: Array<[string, unknown, boolean]> = [
    ['is_enabled', input.isEnabled, false],
    ['assistant_name', input.assistantName?.trim(), false],
    ['avatar_url', input.avatarUrl?.trim(), false],
    ['greeting', input.greeting?.trim(), false],
    ['intro', input.intro?.trim(), false],
    ['whatsapp_number', input.whatsappNumber?.replace(/[^\d+]/g, ''), false],
    ['whatsapp_intro', input.whatsappIntro?.trim(), false],
    ['options', input.options === undefined ? undefined : JSON.stringify(sanitizeOptions(input.options)), true],
  ];
  const setClauses: string[] = ['updated_at = now()'];
  const params: unknown[] = [orgId];
  let idx = 2;
  for (const [col, val, isJson] of fields) {
    if (val !== undefined) {
      setClauses.push(isJson ? `${col} = $${idx++}::jsonb` : `${col} = $${idx++}`);
      params.push(val);
    }
  }
  const { rows } = await client.query<Row>(
    `UPDATE app_admin.public_assistant_settings SET ${setClauses.join(', ')}
     WHERE organization_id = $1 RETURNING ${SELECT}`,
    params,
  );
  return toSettings(rows[0]);
}

/**
 * Config pública para el widget del sitio (sin actor). Devuelve null o
 * enabled:false si no está configurado/activado. NUNCA consulta datos del
 * usuario — su único propósito es alimentar el embudo hacia WhatsApp.
 */
export async function getPublicAssistant(client: PoolClient): Promise<PublicAssistantConfig> {
  const { rows } = await client.query<Row>(
    `SELECT ${SELECT} FROM app_admin.public_assistant_settings
     ORDER BY updated_at DESC LIMIT 1`,
  );
  const row = rows[0];
  if (!row) {
    return {
      enabled: false,
      assistantName: 'Tatiana',
      avatarUrl: '',
      greeting: '',
      intro: '',
      whatsappNumber: '',
      whatsappIntro: '',
      options: [],
    };
  }
  const s = toSettings(row);
  // Solo se activa si está habilitado Y tiene número de WhatsApp configurado.
  const enabled = s.isEnabled && s.whatsappNumber.trim().length > 0;
  return {
    enabled,
    assistantName: s.assistantName,
    avatarUrl: s.avatarUrl,
    greeting: s.greeting,
    intro: s.intro,
    whatsappNumber: s.whatsappNumber,
    whatsappIntro: s.whatsappIntro,
    options: s.options,
  };
}
