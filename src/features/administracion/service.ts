import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import {
  BRANDING_PRESET_CODES,
  LOGIN_LAYOUT_OPTIONS,
  clampBorderRadiusRem,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_OUTBOUND_EMAIL_CONFIG,
  hasText,
  INTEGRATION_CATALOG,
  isValidCssSizeToken,
  OUTBOUND_EMAIL_PROVIDERS,
  requiredOutboundMissing,
  type BrandingPresetCode,
  type BrandingSettings,
  type BrandingSettingsRecord,
  type IntegrationConfigRecord,
  type IntegrationsSettingsRecord,
  type IntegrationKey,
  type LoginLayout,
  type OutboundEmailConfig,
  type OutboundEmailConfigRecord,
} from './types';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const INTEGRATION_KEYS = new Set<IntegrationKey>(INTEGRATION_CATALOG.map((item) => item.key));
const OUTBOUND_PROVIDERS = new Set<string>(OUTBOUND_EMAIL_PROVIDERS);
const LOGIN_LAYOUT_VALUES = new Set<LoginLayout>(LOGIN_LAYOUT_OPTIONS);
const PRESET_CODES = new Set<BrandingPresetCode>(BRANDING_PRESET_CODES);

interface OrganizationRow {
  organization_id: string | null;
}

interface BrandingRow {
  branding_id: string;
  organization_id: string;
  platform_name: string;
  institution_timezone: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  loader_text: string;
  loader_asset_url: string | null;
  typography: string;
  border_radius_rem: number;
  page_max_width: string;
  login_layout: LoginLayout;
  login_welcome_message: string;
  custom_css: string;
  preset_code: BrandingPresetCode;
  created_at: string;
  updated_at: string;
}

interface IntegrationRow {
  integration_id: string;
  integration_key: IntegrationKey;
  label: string;
  provider: string;
  enabled: boolean;
  secret_value: string | null;
  wizard_data: Record<string, unknown> | null;
  last_configured_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OutboundRow {
  outbound_email_id: string;
  organization_id: string;
  enabled: boolean;
  provider: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  api_key: string;
  ses_region: string;
  test_recipient: string;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateIntegrationsInput {
  integrations?: Array<Partial<IntegrationConfigRecord> & { key: IntegrationKey }>;
  outboundEmail?: Partial<OutboundEmailConfig>;
}

export interface OutboundEmailTestResult {
  queuedAt: string;
  recipient: string;
  provider: string;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed : fallback;
}

function normalizeLayout(value: string | undefined, fallback: LoginLayout): LoginLayout {
  if (!value) return fallback;
  return LOGIN_LAYOUT_VALUES.has(value as LoginLayout) ? (value as LoginLayout) : fallback;
}

function normalizePresetCode(
  value: string | undefined,
  fallback: BrandingPresetCode,
): BrandingPresetCode {
  if (!value) return fallback;
  return PRESET_CODES.has(value as BrandingPresetCode)
    ? (value as BrandingPresetCode)
    : fallback;
}

function normalizePageMaxWidth(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return isValidCssSizeToken(trimmed) ? trimmed : fallback;
}

function normalizeCustomCss(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, 20000);
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeWizardData(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, string> = {};
  for (const [key, currentValue] of Object.entries(value as Record<string, unknown>)) {
    if (currentValue === null || currentValue === undefined) continue;
    output[key] = typeof currentValue === 'string' ? currentValue : String(currentValue);
  }

  return output;
}

function mapBrandingRow(row: BrandingRow): BrandingSettingsRecord {
  return {
    brandingId: row.branding_id,
    organizationId: row.organization_id,
    platformName: row.platform_name,
    institutionTimezone: row.institution_timezone,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    logoUrl: row.logo_url ?? '',
    faviconUrl: row.favicon_url ?? '',
    loaderText: row.loader_text,
    loaderAssetUrl: row.loader_asset_url ?? '',
    typography: row.typography,
    borderRadiusRem: Number(row.border_radius_rem),
    pageMaxWidth: row.page_max_width,
    loginLayout: row.login_layout,
    welcomeMessage: row.login_welcome_message,
    customCss: row.custom_css ?? '',
    presetCode: row.preset_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOutboundRow(row: OutboundRow): OutboundEmailConfigRecord {
  return {
    outboundEmailId: row.outbound_email_id,
    organizationId: row.organization_id,
    enabled: row.enabled,
    provider: OUTBOUND_PROVIDERS.has(row.provider) ? (row.provider as OutboundEmailConfig['provider']) : 'smtp',
    fromName: row.from_name,
    fromEmail: row.from_email,
    replyTo: row.reply_to,
    smtpHost: row.smtp_host,
    smtpPort: String(row.smtp_port),
    smtpUser: row.smtp_user,
    smtpPassword: row.smtp_password,
    smtpSecure: row.smtp_secure,
    apiKey: row.api_key,
    sesRegion: row.ses_region,
    testRecipient: row.test_recipient,
    lastTestedAt: row.last_tested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveOrganizationId(client: PoolClient, userId: string): Promise<string> {
  const { rows } = await client.query<OrganizationRow>(
    `
      SELECT u.organization_id::text
      FROM app_core.users u
      WHERE u.user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  const organizationId = rows[0]?.organization_id;
  if (organizationId) {
    return organizationId;
  }

  const { rows: fallbackRows } = await client.query<{ organization_id: string }>(
    `
      SELECT o.organization_id::text
      FROM app_core.organizations o
      ORDER BY o.created_at
      LIMIT 1
    `,
  );

  const fallbackOrganizationId = fallbackRows[0]?.organization_id;
  if (!fallbackOrganizationId) {
    throw new Error('No organizations available to resolve admin scope');
  }

  return fallbackOrganizationId;
}

function normalizeBrandingInput(
  current: BrandingSettingsRecord,
  input: Partial<BrandingSettings>,
): BrandingSettings {
  return {
    platformName: hasText(input.platformName) ? input.platformName!.trim() : current.platformName,
    institutionTimezone: hasText(input.institutionTimezone)
      ? input.institutionTimezone!.trim()
      : current.institutionTimezone,
    primaryColor: normalizeColor(input.primaryColor, current.primaryColor),
    secondaryColor: normalizeColor(input.secondaryColor, current.secondaryColor),
    accentColor: normalizeColor(input.accentColor, current.accentColor),
    logoUrl: asText(input.logoUrl, current.logoUrl).trim(),
    faviconUrl: asText(input.faviconUrl, current.faviconUrl).trim(),
    loaderText: hasText(input.loaderText) ? input.loaderText!.trim() : current.loaderText,
    loaderAssetUrl: asText(input.loaderAssetUrl, current.loaderAssetUrl).trim(),
    typography: hasText(input.typography) ? input.typography!.trim() : current.typography,
    borderRadiusRem: clampBorderRadiusRem(
      typeof input.borderRadiusRem === 'number' ? input.borderRadiusRem : current.borderRadiusRem,
    ),
    pageMaxWidth: normalizePageMaxWidth(input.pageMaxWidth, current.pageMaxWidth),
    loginLayout: normalizeLayout(input.loginLayout, current.loginLayout),
    welcomeMessage: hasText(input.welcomeMessage)
      ? input.welcomeMessage!.trim()
      : current.welcomeMessage,
    customCss: normalizeCustomCss(input.customCss, current.customCss),
    presetCode: normalizePresetCode(input.presetCode, current.presetCode),
  };
}

function integrationFallback(organizationId: string): IntegrationsSettingsRecord {
  return {
    integrations: INTEGRATION_CATALOG.map((catalog) => ({
      integrationId: null,
      key: catalog.key,
      label: catalog.label,
      provider: catalog.provider,
      enabled: false,
      value: '',
      wizardData: {},
      lastConfiguredAt: null,
      createdAt: null,
      updatedAt: null,
    })),
    outboundEmail: {
      outboundEmailId: null,
      organizationId,
      createdAt: null,
      updatedAt: null,
      lastTestedAt: null,
      ...DEFAULT_OUTBOUND_EMAIL_CONFIG,
    },
  };
}

function mergeIntegrations(
  current: IntegrationConfigRecord[],
  updates: Array<Partial<IntegrationConfigRecord> & { key: IntegrationKey }> | undefined,
): IntegrationConfigRecord[] {
  const updateMap = new Map<IntegrationKey, Partial<IntegrationConfigRecord>>();
  for (const update of updates ?? []) {
    if (!INTEGRATION_KEYS.has(update.key)) continue;
    updateMap.set(update.key, update);
  }

  return current.map((item) => {
    const update = updateMap.get(item.key);
    if (!update) return item;

    const wizardData = update.wizardData
      ? normalizeWizardData(update.wizardData)
      : item.wizardData;

    return {
      ...item,
      label: hasText(update.label) ? update.label!.trim() : item.label,
      provider: hasText(update.provider) ? update.provider!.trim() : item.provider,
      enabled: typeof update.enabled === 'boolean' ? update.enabled : item.enabled,
      value: typeof update.value === 'string' ? update.value : item.value,
      wizardData,
      lastConfiguredAt: normalizeDate(update.lastConfiguredAt) ?? item.lastConfiguredAt,
    };
  });
}

function mergeOutbound(
  current: OutboundEmailConfigRecord,
  update: Partial<OutboundEmailConfig> | undefined,
): OutboundEmailConfigRecord {
  if (!update) return current;

  const provider =
    typeof update.provider === 'string' && OUTBOUND_PROVIDERS.has(update.provider)
      ? (update.provider as OutboundEmailConfig['provider'])
      : current.provider;

  return {
    ...current,
    enabled: typeof update.enabled === 'boolean' ? update.enabled : current.enabled,
    provider,
    fromName: typeof update.fromName === 'string' ? update.fromName : current.fromName,
    fromEmail: typeof update.fromEmail === 'string' ? update.fromEmail : current.fromEmail,
    replyTo: typeof update.replyTo === 'string' ? update.replyTo : current.replyTo,
    smtpHost: typeof update.smtpHost === 'string' ? update.smtpHost : current.smtpHost,
    smtpPort: typeof update.smtpPort === 'string' ? update.smtpPort : current.smtpPort,
    smtpUser: typeof update.smtpUser === 'string' ? update.smtpUser : current.smtpUser,
    smtpPassword: typeof update.smtpPassword === 'string' ? update.smtpPassword : current.smtpPassword,
    smtpSecure: typeof update.smtpSecure === 'boolean' ? update.smtpSecure : current.smtpSecure,
    apiKey: typeof update.apiKey === 'string' ? update.apiKey : current.apiKey,
    sesRegion: typeof update.sesRegion === 'string' ? update.sesRegion : current.sesRegion,
    testRecipient: typeof update.testRecipient === 'string' ? update.testRecipient : current.testRecipient,
  };
}

export async function getBrandingSettings(
  client: PoolClient,
  actor: AuthUser,
): Promise<BrandingSettingsRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const organizationId = await resolveOrganizationId(client, actor.userId);
  const { rows } = await client.query<BrandingRow>(
    `
      SELECT
        bs.branding_id::text,
        bs.organization_id::text,
        bs.platform_name,
        bs.institution_timezone,
        bs.primary_color,
        bs.secondary_color,
        bs.accent_color,
        bs.logo_url,
        bs.favicon_url,
        bs.loader_text,
        bs.loader_asset_url,
        bs.typography,
        bs.border_radius_rem::float8 AS border_radius_rem,
        bs.page_max_width,
        bs.login_layout,
        bs.login_welcome_message,
        bs.custom_css,
        bs.preset_code,
        bs.created_at::text,
        bs.updated_at::text
      FROM app_admin.branding_settings bs
      WHERE bs.organization_id = $1::uuid
      LIMIT 1
    `,
    [organizationId],
  );

  const row = rows[0];
  if (!row) {
    return {
      brandingId: null,
      organizationId,
      ...DEFAULT_BRANDING_SETTINGS,
      createdAt: null,
      updatedAt: null,
    };
  }

  return mapBrandingRow(row);
}

export async function updateBrandingSettings(
  client: PoolClient,
  actor: AuthUser,
  input: Partial<BrandingSettings>,
): Promise<BrandingSettingsRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const current = await getBrandingSettings(client, actor);
  const next = normalizeBrandingInput(current, input);

  const { rows } = await client.query<BrandingRow>(
    `
      INSERT INTO app_admin.branding_settings (
        organization_id,
        platform_name,
        institution_timezone,
        primary_color,
        secondary_color,
        accent_color,
        logo_url,
        favicon_url,
        loader_text,
        loader_asset_url,
        typography,
        border_radius_rem,
        page_max_width,
        login_layout,
        login_welcome_message,
        custom_css,
        preset_code,
        created_by,
        updated_by
      )
      VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        NULLIF($7, ''),
        NULLIF($8, ''),
        $9,
        NULLIF($10, ''),
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18::uuid,
        $18::uuid
      )
      ON CONFLICT (organization_id) DO UPDATE
      SET platform_name = EXCLUDED.platform_name,
          institution_timezone = EXCLUDED.institution_timezone,
          primary_color = EXCLUDED.primary_color,
          secondary_color = EXCLUDED.secondary_color,
          accent_color = EXCLUDED.accent_color,
          logo_url = EXCLUDED.logo_url,
          favicon_url = EXCLUDED.favicon_url,
          loader_text = EXCLUDED.loader_text,
          loader_asset_url = EXCLUDED.loader_asset_url,
          typography = EXCLUDED.typography,
          border_radius_rem = EXCLUDED.border_radius_rem,
          page_max_width = EXCLUDED.page_max_width,
          login_layout = EXCLUDED.login_layout,
          login_welcome_message = EXCLUDED.login_welcome_message,
          custom_css = EXCLUDED.custom_css,
          preset_code = EXCLUDED.preset_code,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
      RETURNING
        branding_id::text,
        organization_id::text,
        platform_name,
        institution_timezone,
        primary_color,
        secondary_color,
        accent_color,
        logo_url,
        favicon_url,
        loader_text,
        loader_asset_url,
        typography,
        border_radius_rem::float8 AS border_radius_rem,
        page_max_width,
        login_layout,
        login_welcome_message,
        custom_css,
        preset_code,
        created_at::text,
        updated_at::text
    `,
    [
      current.organizationId,
      next.platformName,
      next.institutionTimezone,
      next.primaryColor,
      next.secondaryColor,
      next.accentColor,
      next.logoUrl,
      next.faviconUrl,
      next.loaderText,
      next.loaderAssetUrl,
      next.typography,
      next.borderRadiusRem,
      next.pageMaxWidth,
      next.loginLayout,
      next.welcomeMessage,
      next.customCss,
      next.presetCode,
      actor.userId,
    ],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to persist branding settings');
  }

  return mapBrandingRow(row);
}

export async function getPublicBrandingSettings(
  client: PoolClient,
  organizationId?: string,
): Promise<BrandingSettingsRecord> {
  const queryByOrganization = `
    SELECT
      bs.branding_id::text,
      bs.organization_id::text,
      bs.platform_name,
      bs.institution_timezone,
      bs.primary_color,
      bs.secondary_color,
      bs.accent_color,
      bs.logo_url,
      bs.favicon_url,
      bs.loader_text,
      bs.loader_asset_url,
      bs.typography,
      bs.border_radius_rem::float8 AS border_radius_rem,
      bs.page_max_width,
      bs.login_layout,
      bs.login_welcome_message,
      bs.custom_css,
      bs.preset_code,
      bs.created_at::text,
      bs.updated_at::text
    FROM app_admin.branding_settings bs
    WHERE bs.organization_id = $1::uuid
    LIMIT 1
  `;

  const queryLatest = `
    SELECT
      bs.branding_id::text,
      bs.organization_id::text,
      bs.platform_name,
      bs.institution_timezone,
      bs.primary_color,
      bs.secondary_color,
      bs.accent_color,
      bs.logo_url,
      bs.favicon_url,
      bs.loader_text,
      bs.loader_asset_url,
      bs.typography,
      bs.border_radius_rem::float8 AS border_radius_rem,
      bs.page_max_width,
      bs.login_layout,
      bs.login_welcome_message,
      bs.custom_css,
      bs.preset_code,
      bs.created_at::text,
      bs.updated_at::text
    FROM app_admin.branding_settings bs
    ORDER BY bs.updated_at DESC
    LIMIT 1
  `;

  let row: BrandingRow | undefined;
  if (organizationId) {
    const { rows } = await client.query<BrandingRow>(queryByOrganization, [organizationId]);
    row = rows[0];
  }

  if (!row) {
    const { rows } = await client.query<BrandingRow>(queryLatest);
    row = rows[0];
  }

  if (row) {
    return mapBrandingRow(row);
  }

  const { rows: fallbackOrgRows } = await client.query<{ organization_id: string }>(
    `
      SELECT organization_id::text
      FROM app_core.organizations
      ORDER BY created_at
      LIMIT 1
    `,
  );

  const fallbackOrganizationId = fallbackOrgRows[0]?.organization_id;
  if (!fallbackOrganizationId) {
    throw new Error('No organization found for public branding');
  }

  return {
    brandingId: null,
    organizationId: fallbackOrganizationId,
    ...DEFAULT_BRANDING_SETTINGS,
    createdAt: null,
    updatedAt: null,
  };
}

export async function getIntegrationsSettings(
  client: PoolClient,
  actor: AuthUser,
): Promise<IntegrationsSettingsRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const organizationId = await resolveOrganizationId(client, actor.userId);
  const fallback = integrationFallback(organizationId);

  const { rows: integrationRows } = await client.query<IntegrationRow>(
    `
      SELECT
        ic.integration_id::text,
        ic.integration_key,
        ic.label,
        ic.provider,
        ic.enabled,
        ic.secret_value,
        ic.wizard_data,
        ic.last_configured_at::text,
        ic.created_at::text,
        ic.updated_at::text
      FROM app_admin.integration_configs ic
      WHERE ic.organization_id = $1::uuid
      ORDER BY ic.integration_key
    `,
    [organizationId],
  );

  const byKey = new Map<IntegrationKey, IntegrationRow>();
  for (const row of integrationRows) {
    if (!INTEGRATION_KEYS.has(row.integration_key)) continue;
    byKey.set(row.integration_key, row);
  }

  const integrations = INTEGRATION_CATALOG.map((catalog) => {
    const row = byKey.get(catalog.key);
    if (!row) {
      return fallback.integrations.find((item) => item.key === catalog.key)!;
    }

    return {
      integrationId: row.integration_id,
      key: catalog.key,
      label: hasText(row.label) ? row.label : catalog.label,
      provider: hasText(row.provider) ? row.provider : catalog.provider,
      enabled: row.enabled,
      value: row.secret_value ?? '',
      wizardData: normalizeWizardData(row.wizard_data),
      lastConfiguredAt: row.last_configured_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies IntegrationConfigRecord;
  });

  const { rows: outboundRows } = await client.query<OutboundRow>(
    `
      SELECT
        oe.outbound_email_id::text,
        oe.organization_id::text,
        oe.enabled,
        oe.provider,
        oe.from_name,
        oe.from_email,
        oe.reply_to,
        oe.smtp_host,
        oe.smtp_port,
        oe.smtp_user,
        oe.smtp_password,
        oe.smtp_secure,
        oe.api_key,
        oe.ses_region,
        oe.test_recipient,
        oe.last_tested_at::text,
        oe.created_at::text,
        oe.updated_at::text
      FROM app_admin.outbound_email_configs oe
      WHERE oe.organization_id = $1::uuid
      LIMIT 1
    `,
    [organizationId],
  );

  const outboundRow = outboundRows[0];
  const outboundEmail = outboundRow
    ? mapOutboundRow(outboundRow)
    : {
        outboundEmailId: null,
        organizationId,
        createdAt: null,
        updatedAt: null,
        lastTestedAt: null,
        ...DEFAULT_OUTBOUND_EMAIL_CONFIG,
      };

  return {
    integrations,
    outboundEmail,
  };
}

export async function updateIntegrationsSettings(
  client: PoolClient,
  actor: AuthUser,
  input: UpdateIntegrationsInput,
): Promise<IntegrationsSettingsRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const current = await getIntegrationsSettings(client, actor);
  const organizationId = current.outboundEmail.organizationId;
  const integrations = mergeIntegrations(current.integrations, input.integrations);
  const outboundEmail = mergeOutbound(current.outboundEmail, input.outboundEmail);

  for (const integration of integrations) {
    await client.query(
      `
        INSERT INTO app_admin.integration_configs (
          organization_id,
          integration_key,
          label,
          provider,
          enabled,
          secret_value,
          wizard_data,
          last_configured_at,
          created_by,
          updated_by
        )
        VALUES ($1::uuid, $2, $3, $4, $5, NULLIF($6, ''), $7::jsonb, $8::timestamptz, $9::uuid, $9::uuid)
        ON CONFLICT (organization_id, integration_key) DO UPDATE
        SET label = EXCLUDED.label,
            provider = EXCLUDED.provider,
            enabled = EXCLUDED.enabled,
            secret_value = EXCLUDED.secret_value,
            wizard_data = EXCLUDED.wizard_data,
            last_configured_at = EXCLUDED.last_configured_at,
            updated_by = EXCLUDED.updated_by,
            updated_at = now()
      `,
      [
        organizationId,
        integration.key,
        hasText(integration.label) ? integration.label.trim() : integration.key,
        hasText(integration.provider) ? integration.provider.trim() : 'Custom',
        integration.enabled,
        integration.value,
        JSON.stringify(normalizeWizardData(integration.wizardData)),
        normalizeDate(integration.lastConfiguredAt),
        actor.userId,
      ],
    );
  }

  const smtpPort = Number.parseInt(outboundEmail.smtpPort, 10);
  const safeSmtpPort = Number.isFinite(smtpPort) && smtpPort > 0 ? smtpPort : 587;

  await client.query(
    `
      INSERT INTO app_admin.outbound_email_configs (
        organization_id,
        enabled,
        provider,
        from_name,
        from_email,
        reply_to,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_password,
        smtp_secure,
        api_key,
        ses_region,
        test_recipient,
        created_by,
        updated_by
      )
      VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15::uuid,
        $15::uuid
      )
      ON CONFLICT (organization_id) DO UPDATE
      SET enabled = EXCLUDED.enabled,
          provider = EXCLUDED.provider,
          from_name = EXCLUDED.from_name,
          from_email = EXCLUDED.from_email,
          reply_to = EXCLUDED.reply_to,
          smtp_host = EXCLUDED.smtp_host,
          smtp_port = EXCLUDED.smtp_port,
          smtp_user = EXCLUDED.smtp_user,
          smtp_password = EXCLUDED.smtp_password,
          smtp_secure = EXCLUDED.smtp_secure,
          api_key = EXCLUDED.api_key,
          ses_region = EXCLUDED.ses_region,
          test_recipient = EXCLUDED.test_recipient,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
    `,
    [
      organizationId,
      outboundEmail.enabled,
      outboundEmail.provider,
      outboundEmail.fromName,
      outboundEmail.fromEmail,
      outboundEmail.replyTo,
      outboundEmail.smtpHost,
      safeSmtpPort,
      outboundEmail.smtpUser,
      outboundEmail.smtpPassword,
      outboundEmail.smtpSecure,
      outboundEmail.apiKey,
      outboundEmail.sesRegion,
      outboundEmail.testRecipient,
      actor.userId,
    ],
  );

  return getIntegrationsSettings(client, actor);
}

export async function queueOutboundEmailTest(
  client: PoolClient,
  actor: AuthUser,
  requestedRecipient?: string,
): Promise<OutboundEmailTestResult> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const settings = await getIntegrationsSettings(client, actor);
  const missing = requiredOutboundMissing(settings.outboundEmail);
  if (missing.length > 0) {
    throw new Error(`Outbound email configuration is incomplete: ${missing.join(', ')}`);
  }

  const recipient =
    (requestedRecipient ?? '').trim() ||
    settings.outboundEmail.testRecipient.trim() ||
    settings.outboundEmail.replyTo.trim() ||
    settings.outboundEmail.fromEmail.trim();

  if (!recipient) {
    throw new Error('No test recipient configured');
  }

  const { rows } = await client.query<{ queued_at: string }>(
    `
      UPDATE app_admin.outbound_email_configs
      SET
        test_recipient = $2,
        last_tested_at = now(),
        updated_by = $3::uuid,
        updated_at = now()
      WHERE organization_id = $1::uuid
      RETURNING last_tested_at::text AS queued_at
    `,
    [settings.outboundEmail.organizationId, recipient, actor.userId],
  );

  if (!rows[0]?.queued_at) {
    throw new Error('Outbound email settings are not persisted yet');
  }

  return {
    queuedAt: rows[0].queued_at,
    recipient,
    provider: settings.outboundEmail.provider,
  };
}
