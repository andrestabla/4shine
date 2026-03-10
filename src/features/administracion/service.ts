import type { PoolClient } from 'pg';
import nodemailer from 'nodemailer';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import {
  BRANDING_REVISION_REASONS,
  BRANDING_PRESET_CODES,
  LOGIN_LAYOUT_OPTIONS,
  clampOpacity,
  clampBorderRadiusRem,
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_OUTBOUND_EMAIL_CONFIG,
  hasText,
  INTEGRATION_CATALOG,
  isValidCssSizeToken,
  OUTBOUND_EMAIL_PROVIDERS,
  requiredOutboundMissing,
  type BrandingRevisionReason,
  type BrandingRevisionRecord,
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
const REVISION_REASONS = new Set<string>(BRANDING_REVISION_REASONS);
const MAX_DYNAMIC_LOGIN_IMAGE_ITEMS = 20;
const MAX_DYNAMIC_LOGIN_MESSAGE_ITEMS = 20;
const MAX_DYNAMIC_LOGIN_MESSAGE_LENGTH = 400;

const BRANDING_FIELD_KEYS: Array<keyof BrandingSettings> = [
  'platformName',
  'institutionTimezone',
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'logoUrl',
  'faviconUrl',
  'loaderText',
  'loaderAssetUrl',
  'typography',
  'borderRadiusRem',
  'pageMaxWidth',
  'loginLayout',
  'loginOverlayColor',
  'loginOverlayOpacity',
  'welcomeMessage',
  'loginHeadline',
  'loginSupportMessage',
  'imageWelcomeMessage',
  'imageLoginHeadline',
  'imageLoginSupportMessage',
  'loginBackgroundImageUrl',
  'loginBackgroundImageUrls',
  'loginImageUrls',
  'imageWelcomeMessages',
  'showPlatformName',
  'showWelcomeMessage',
  'showLoginHeadline',
  'showLoginSupportMessage',
  'showImageWelcomeMessage',
  'showImageLoginHeadline',
  'showImageLoginSupportMessage',
  'showLoaderText',
  'customCss',
  'presetCode',
];

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
  login_overlay_color: string;
  login_overlay_opacity: number;
  login_welcome_message: string;
  login_headline: string;
  login_support_message: string;
  image_welcome_message: string;
  image_login_headline: string;
  image_login_support_message: string;
  login_background_image_url: string | null;
  login_background_image_urls: string[] | null;
  login_image_urls: string[] | null;
  image_welcome_messages: string[] | null;
  show_platform_name: boolean;
  show_welcome_message: boolean;
  show_login_headline: boolean;
  show_login_support_message: boolean;
  show_image_welcome_message: boolean;
  show_image_login_headline: boolean;
  show_image_login_support_message: boolean;
  show_loader_text: boolean;
  custom_css: string;
  preset_code: BrandingPresetCode;
  created_at: string;
  updated_at: string;
}

interface BrandingRevisionRow {
  revision_id: string;
  branding_id: string | null;
  organization_id: string;
  reason: string;
  source_revision_id: string | null;
  changed_fields: string[] | null;
  snapshot: Record<string, unknown> | null;
  change_summary: Record<string, unknown> | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
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
  messageId: string | null;
}

export interface BrandingUpdateResult {
  settings: BrandingSettingsRecord;
  previousSettings: BrandingSettingsRecord;
  changedFields: string[];
  changes: Record<string, { previous: unknown; next: unknown }>;
  revisionId: string | null;
  reason: BrandingRevisionReason;
  sourceRevisionId: string | null;
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
  const raw = value.trim().toLowerCase();

  if (raw === 'split') return 'image_left';
  if (raw === 'centered' || raw === 'minimal') return 'centered_image';

  return LOGIN_LAYOUT_VALUES.has(raw as LoginLayout) ? (raw as LoginLayout) : fallback;
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

function normalizeMediaUrl(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, 2000);
}

function normalizeStringArray(
  value: unknown,
  options?: {
    maxItems?: number;
    maxLength?: number;
    fallback?: string[];
  },
): string[] {
  const maxItems = options?.maxItems ?? MAX_DYNAMIC_LOGIN_IMAGE_ITEMS;
  const maxLength = options?.maxLength ?? 2000;
  const fallback = options?.fallback ?? [];

  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split('\n')
      : fallback;

  const deduped = new Set<string>();
  for (const item of source) {
    if (typeof item !== 'string') continue;
    const normalized = item.trim().slice(0, maxLength);
    if (!normalized) continue;
    deduped.add(normalized);
    if (deduped.size >= maxItems) break;
  }

  return [...deduped];
}

function normalizeMediaUrlList(value: unknown, fallback: string[] = []): string[] {
  const normalized = normalizeStringArray(value, {
    fallback,
    maxItems: MAX_DYNAMIC_LOGIN_IMAGE_ITEMS,
    maxLength: 2000,
  });
  return normalized.map((item) => normalizeMediaUrl(item, '')).filter(hasText);
}

function normalizeMessageList(value: unknown, fallback: string[] = []): string[] {
  const normalized = normalizeStringArray(value, {
    fallback,
    maxItems: MAX_DYNAMIC_LOGIN_MESSAGE_ITEMS,
    maxLength: MAX_DYNAMIC_LOGIN_MESSAGE_LENGTH,
  });
  return normalized.filter(hasText);
}

function valuesEqual(previous: unknown, next: unknown): boolean {
  if (Array.isArray(previous) && Array.isArray(next)) {
    if (previous.length !== next.length) return false;
    return previous.every((item, index) => Object.is(item, next[index]));
  }
  return Object.is(previous, next);
}

function normalizeOpacity(value: unknown, fallback: number): number {
  if (typeof value === 'number') return clampOpacity(value);
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? clampOpacity(parsed) : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  return fallback;
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
    const raw = typeof currentValue === 'string' ? currentValue : String(currentValue);
    if (key === 'allowedMimeTypes') {
      output[key] = raw
        .replace(/\\r\\n/gi, '\n')
        .replace(/\\n/gi, '\n')
        .replace(/\\r/gi, '\n');
      continue;
    }
    output[key] = raw;
  }

  return output;
}

function mapBrandingRow(row: BrandingRow): BrandingSettingsRecord {
  const loginBackgroundImageUrls = normalizeMediaUrlList(row.login_background_image_urls, [
    row.login_background_image_url ?? '',
  ]);
  const loginImageUrls = normalizeMediaUrlList(
    row.login_image_urls,
    loginBackgroundImageUrls.length > 0
      ? loginBackgroundImageUrls
      : [row.login_background_image_url ?? ''],
  );
  const imageWelcomeMessages = normalizeMessageList(row.image_welcome_messages, [
    row.image_welcome_message,
  ]);

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
    loginOverlayColor: row.login_overlay_color,
    loginOverlayOpacity: Number(row.login_overlay_opacity),
    welcomeMessage: row.login_welcome_message,
    loginHeadline: row.login_headline,
    loginSupportMessage: row.login_support_message,
    imageWelcomeMessage: row.image_welcome_message ?? imageWelcomeMessages[0] ?? '',
    imageLoginHeadline: row.image_login_headline,
    imageLoginSupportMessage: row.image_login_support_message,
    loginBackgroundImageUrl: row.login_background_image_url ?? loginBackgroundImageUrls[0] ?? '',
    loginBackgroundImageUrls,
    loginImageUrls,
    imageWelcomeMessages,
    showPlatformName: row.show_platform_name,
    showWelcomeMessage: row.show_welcome_message,
    showLoginHeadline: row.show_login_headline,
    showLoginSupportMessage: row.show_login_support_message,
    showImageWelcomeMessage: row.show_image_welcome_message,
    showImageLoginHeadline: row.show_image_login_headline,
    showImageLoginSupportMessage: row.show_image_login_support_message,
    showLoaderText: row.show_loader_text,
    customCss: row.custom_css ?? '',
    presetCode: row.preset_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isBrandingRevisionReason(value: string): value is BrandingRevisionReason {
  return REVISION_REASONS.has(value);
}

function toBrandingSettingsSnapshot(input: BrandingSettings | BrandingSettingsRecord): BrandingSettings {
  return {
    platformName: input.platformName,
    institutionTimezone: input.institutionTimezone,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
    logoUrl: input.logoUrl,
    faviconUrl: input.faviconUrl,
    loaderText: input.loaderText,
    loaderAssetUrl: input.loaderAssetUrl,
    typography: input.typography,
    borderRadiusRem: input.borderRadiusRem,
    pageMaxWidth: input.pageMaxWidth,
    loginLayout: input.loginLayout,
    loginOverlayColor: input.loginOverlayColor,
    loginOverlayOpacity: input.loginOverlayOpacity,
    welcomeMessage: input.welcomeMessage,
    loginHeadline: input.loginHeadline,
    loginSupportMessage: input.loginSupportMessage,
    imageWelcomeMessage: input.imageWelcomeMessage,
    imageLoginHeadline: input.imageLoginHeadline,
    imageLoginSupportMessage: input.imageLoginSupportMessage,
    loginBackgroundImageUrl: input.loginBackgroundImageUrl,
    loginBackgroundImageUrls: input.loginBackgroundImageUrls,
    loginImageUrls: input.loginImageUrls,
    imageWelcomeMessages: input.imageWelcomeMessages,
    showPlatformName: input.showPlatformName,
    showWelcomeMessage: input.showWelcomeMessage,
    showLoginHeadline: input.showLoginHeadline,
    showLoginSupportMessage: input.showLoginSupportMessage,
    showImageWelcomeMessage: input.showImageWelcomeMessage,
    showImageLoginHeadline: input.showImageLoginHeadline,
    showImageLoginSupportMessage: input.showImageLoginSupportMessage,
    showLoaderText: input.showLoaderText,
    customCss: input.customCss,
    presetCode: input.presetCode,
  };
}

function normalizeBrandingSnapshot(value: unknown): BrandingSettings {
  const snapshot = value && typeof value === 'object' ? (value as Partial<BrandingSettings>) : {};
  const borderRadiusCandidate =
    typeof snapshot.borderRadiusRem === 'number'
      ? snapshot.borderRadiusRem
      : Number.parseFloat(String(snapshot.borderRadiusRem ?? ''));
  const normalizedLoginBackgroundImageUrl = normalizeMediaUrl(
    snapshot.loginBackgroundImageUrl,
    DEFAULT_BRANDING_SETTINGS.loginBackgroundImageUrl,
  );
  const normalizedImageWelcomeMessage = hasText(snapshot.imageWelcomeMessage)
    ? snapshot.imageWelcomeMessage!.trim()
    : DEFAULT_BRANDING_SETTINGS.imageWelcomeMessage;
  const normalizedLoginBackgroundImageUrls = normalizeMediaUrlList(
    snapshot.loginBackgroundImageUrls,
    [normalizedLoginBackgroundImageUrl],
  );
  const normalizedLoginImageUrls = normalizeMediaUrlList(
    snapshot.loginImageUrls,
    normalizedLoginBackgroundImageUrls,
  );
  const normalizedImageWelcomeMessages = normalizeMessageList(
    snapshot.imageWelcomeMessages,
    [normalizedImageWelcomeMessage],
  );

  return {
    platformName: hasText(snapshot.platformName)
      ? snapshot.platformName!.trim()
      : DEFAULT_BRANDING_SETTINGS.platformName,
    institutionTimezone: hasText(snapshot.institutionTimezone)
      ? snapshot.institutionTimezone!.trim()
      : DEFAULT_BRANDING_SETTINGS.institutionTimezone,
    primaryColor: normalizeColor(snapshot.primaryColor, DEFAULT_BRANDING_SETTINGS.primaryColor),
    secondaryColor: normalizeColor(snapshot.secondaryColor, DEFAULT_BRANDING_SETTINGS.secondaryColor),
    accentColor: normalizeColor(snapshot.accentColor, DEFAULT_BRANDING_SETTINGS.accentColor),
    logoUrl: asText(snapshot.logoUrl, DEFAULT_BRANDING_SETTINGS.logoUrl).trim(),
    faviconUrl: asText(snapshot.faviconUrl, DEFAULT_BRANDING_SETTINGS.faviconUrl).trim(),
    loaderText: hasText(snapshot.loaderText)
      ? snapshot.loaderText!.trim()
      : DEFAULT_BRANDING_SETTINGS.loaderText,
    loaderAssetUrl: asText(snapshot.loaderAssetUrl, DEFAULT_BRANDING_SETTINGS.loaderAssetUrl).trim(),
    typography: hasText(snapshot.typography)
      ? snapshot.typography!.trim()
      : DEFAULT_BRANDING_SETTINGS.typography,
    borderRadiusRem: clampBorderRadiusRem(borderRadiusCandidate),
    pageMaxWidth: normalizePageMaxWidth(snapshot.pageMaxWidth, DEFAULT_BRANDING_SETTINGS.pageMaxWidth),
    loginLayout: normalizeLayout(snapshot.loginLayout, DEFAULT_BRANDING_SETTINGS.loginLayout),
    loginOverlayColor: normalizeColor(
      snapshot.loginOverlayColor,
      DEFAULT_BRANDING_SETTINGS.loginOverlayColor,
    ),
    loginOverlayOpacity: normalizeOpacity(
      snapshot.loginOverlayOpacity,
      DEFAULT_BRANDING_SETTINGS.loginOverlayOpacity,
    ),
    welcomeMessage: hasText(snapshot.welcomeMessage)
      ? snapshot.welcomeMessage!.trim()
      : DEFAULT_BRANDING_SETTINGS.welcomeMessage,
    loginHeadline: hasText(snapshot.loginHeadline)
      ? snapshot.loginHeadline!.trim()
      : DEFAULT_BRANDING_SETTINGS.loginHeadline,
    loginSupportMessage: hasText(snapshot.loginSupportMessage)
      ? snapshot.loginSupportMessage!.trim()
      : DEFAULT_BRANDING_SETTINGS.loginSupportMessage,
    imageWelcomeMessage: hasText(snapshot.imageWelcomeMessage)
      ? snapshot.imageWelcomeMessage!.trim()
      : DEFAULT_BRANDING_SETTINGS.imageWelcomeMessage,
    imageLoginHeadline: hasText(snapshot.imageLoginHeadline)
      ? snapshot.imageLoginHeadline!.trim()
      : DEFAULT_BRANDING_SETTINGS.imageLoginHeadline,
    imageLoginSupportMessage: hasText(snapshot.imageLoginSupportMessage)
      ? snapshot.imageLoginSupportMessage!.trim()
      : DEFAULT_BRANDING_SETTINGS.imageLoginSupportMessage,
    loginBackgroundImageUrl: normalizedLoginBackgroundImageUrl,
    loginBackgroundImageUrls: normalizedLoginBackgroundImageUrls,
    loginImageUrls: normalizedLoginImageUrls,
    imageWelcomeMessages: normalizedImageWelcomeMessages,
    showPlatformName: normalizeBoolean(
      snapshot.showPlatformName,
      DEFAULT_BRANDING_SETTINGS.showPlatformName,
    ),
    showWelcomeMessage: normalizeBoolean(
      snapshot.showWelcomeMessage,
      DEFAULT_BRANDING_SETTINGS.showWelcomeMessage,
    ),
    showLoginHeadline: normalizeBoolean(
      snapshot.showLoginHeadline,
      DEFAULT_BRANDING_SETTINGS.showLoginHeadline,
    ),
    showLoginSupportMessage: normalizeBoolean(
      snapshot.showLoginSupportMessage,
      DEFAULT_BRANDING_SETTINGS.showLoginSupportMessage,
    ),
    showImageWelcomeMessage: normalizeBoolean(
      snapshot.showImageWelcomeMessage,
      DEFAULT_BRANDING_SETTINGS.showImageWelcomeMessage,
    ),
    showImageLoginHeadline: normalizeBoolean(
      snapshot.showImageLoginHeadline,
      DEFAULT_BRANDING_SETTINGS.showImageLoginHeadline,
    ),
    showImageLoginSupportMessage: normalizeBoolean(
      snapshot.showImageLoginSupportMessage,
      DEFAULT_BRANDING_SETTINGS.showImageLoginSupportMessage,
    ),
    showLoaderText: normalizeBoolean(
      snapshot.showLoaderText,
      DEFAULT_BRANDING_SETTINGS.showLoaderText,
    ),
    customCss: normalizeCustomCss(snapshot.customCss, DEFAULT_BRANDING_SETTINGS.customCss),
    presetCode: normalizePresetCode(snapshot.presetCode, DEFAULT_BRANDING_SETTINGS.presetCode),
  };
}

function computeBrandingChanges(previous: BrandingSettings, next: BrandingSettings): {
  changedFields: string[];
  changes: Record<string, { previous: unknown; next: unknown }>;
} {
  const changedFields: string[] = [];
  const changes: Record<string, { previous: unknown; next: unknown }> = {};

  for (const key of BRANDING_FIELD_KEYS) {
    if (valuesEqual(previous[key], next[key])) continue;
    changedFields.push(key);
    changes[key] = {
      previous: previous[key],
      next: next[key],
    };
  }

  return {
    changedFields,
    changes,
  };
}

function mapBrandingRevisionRow(row: BrandingRevisionRow): BrandingRevisionRecord {
  return {
    revisionId: row.revision_id,
    brandingId: row.branding_id,
    organizationId: row.organization_id,
    reason: isBrandingRevisionReason(row.reason) ? row.reason : 'manual_update',
    sourceRevisionId: row.source_revision_id,
    changedFields: row.changed_fields ?? [],
    snapshot: normalizeBrandingSnapshot(row.snapshot),
    changeSummary: row.change_summary ?? {},
    createdByUserId: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

async function writeBrandingRevision(
  client: PoolClient,
  input: {
    organizationId: string;
    brandingId: string | null;
    reason: BrandingRevisionReason;
    sourceRevisionId?: string | null;
    changedFields: string[];
    snapshot: BrandingSettings;
    changeSummary: Record<string, unknown>;
    actorUserId: string;
  },
): Promise<string | null> {
  const { rows } = await client.query<{ revision_id: string }>(
    `
      INSERT INTO app_admin.branding_revisions (
        organization_id,
        branding_id,
        reason,
        source_revision_id,
        changed_fields,
        snapshot,
        change_summary,
        created_by
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3,
        $4::uuid,
        $5::text[],
        $6::jsonb,
        $7::jsonb,
        $8::uuid
      )
      RETURNING revision_id::text
    `,
    [
      input.organizationId,
      input.brandingId,
      input.reason,
      input.sourceRevisionId ?? null,
      input.changedFields,
      JSON.stringify(input.snapshot),
      JSON.stringify(input.changeSummary),
      input.actorUserId,
    ],
  );

  return rows[0]?.revision_id ?? null;
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
  const loginBackgroundImageUrls =
    input.loginBackgroundImageUrls === undefined
      ? current.loginBackgroundImageUrls
      : normalizeMediaUrlList(input.loginBackgroundImageUrls, []);

  const loginImageUrls =
    input.loginImageUrls === undefined
      ? current.loginImageUrls
      : normalizeMediaUrlList(input.loginImageUrls, []);

  const imageWelcomeMessages =
    input.imageWelcomeMessages === undefined
      ? current.imageWelcomeMessages
      : normalizeMessageList(input.imageWelcomeMessages, []);

  const normalizedLoginBackgroundImageUrl = normalizeMediaUrl(
    input.loginBackgroundImageUrl,
    loginBackgroundImageUrls[0] ?? current.loginBackgroundImageUrl,
  );

  const normalizedImageWelcomeMessage = hasText(input.imageWelcomeMessage)
    ? input.imageWelcomeMessage!.trim()
    : imageWelcomeMessages[0] ?? current.imageWelcomeMessage;

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
    loginOverlayColor: normalizeColor(input.loginOverlayColor, current.loginOverlayColor),
    loginOverlayOpacity: normalizeOpacity(input.loginOverlayOpacity, current.loginOverlayOpacity),
    welcomeMessage: hasText(input.welcomeMessage)
      ? input.welcomeMessage!.trim()
      : current.welcomeMessage,
    loginHeadline: hasText(input.loginHeadline)
      ? input.loginHeadline!.trim()
      : current.loginHeadline,
    loginSupportMessage: hasText(input.loginSupportMessage)
      ? input.loginSupportMessage!.trim()
      : current.loginSupportMessage,
    imageWelcomeMessage: normalizedImageWelcomeMessage,
    imageLoginHeadline: hasText(input.imageLoginHeadline)
      ? input.imageLoginHeadline!.trim()
      : current.imageLoginHeadline,
    imageLoginSupportMessage: hasText(input.imageLoginSupportMessage)
      ? input.imageLoginSupportMessage!.trim()
      : current.imageLoginSupportMessage,
    loginBackgroundImageUrl: normalizedLoginBackgroundImageUrl,
    loginBackgroundImageUrls,
    loginImageUrls,
    imageWelcomeMessages,
    showPlatformName: normalizeBoolean(input.showPlatformName, current.showPlatformName),
    showWelcomeMessage: normalizeBoolean(input.showWelcomeMessage, current.showWelcomeMessage),
    showLoginHeadline: normalizeBoolean(input.showLoginHeadline, current.showLoginHeadline),
    showLoginSupportMessage: normalizeBoolean(
      input.showLoginSupportMessage,
      current.showLoginSupportMessage,
    ),
    showImageWelcomeMessage: normalizeBoolean(
      input.showImageWelcomeMessage,
      current.showImageWelcomeMessage,
    ),
    showImageLoginHeadline: normalizeBoolean(
      input.showImageLoginHeadline,
      current.showImageLoginHeadline,
    ),
    showImageLoginSupportMessage: normalizeBoolean(
      input.showImageLoginSupportMessage,
      current.showImageLoginSupportMessage,
    ),
    showLoaderText: normalizeBoolean(input.showLoaderText, current.showLoaderText),
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

function hasUsableEmail(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function buildFromHeader(config: OutboundEmailConfigRecord): string {
  const fromEmail = config.fromEmail.trim();
  const fromName = config.fromName.trim();
  if (!fromName) return fromEmail;

  const escaped = fromName.replace(/"/g, '\\"');
  return `"${escaped}" <${fromEmail}>`;
}

function buildTestEmailPayload(config: OutboundEmailConfigRecord, recipient: string): {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
} {
  const timestamp = new Date().toISOString();
  const from = buildFromHeader(config);
  const replyTo = config.replyTo.trim();
  const subject = '4Shine · Prueba de correo saliente';
  const text = [
    'Este es un correo de prueba generado por 4Shine.',
    '',
    `Proveedor: ${config.provider}`,
    `Fecha: ${timestamp}`,
    `Destinatario: ${recipient}`,
  ].join('\n');
  const html = [
    '<div style="font-family:Inter,Arial,sans-serif;line-height:1.45;color:#0f172a;">',
    '<h2 style="margin:0 0 10px 0;">Prueba de correo saliente</h2>',
    '<p style="margin:0 0 8px 0;">Este es un correo de prueba generado por 4Shine.</p>',
    `<p style="margin:0;"><strong>Proveedor:</strong> ${config.provider}</p>`,
    `<p style="margin:0;"><strong>Fecha:</strong> ${timestamp}</p>`,
    `<p style="margin:0;"><strong>Destinatario:</strong> ${recipient}</p>`,
    '</div>',
  ].join('');

  return {
    from,
    to: recipient,
    subject,
    text,
    html,
    ...(hasText(replyTo) ? { replyTo } : {}),
  };
}

async function sendViaSmtp(
  config: OutboundEmailConfigRecord,
  recipient: string,
): Promise<string | null> {
  const smtpHost = config.smtpHost.trim();
  const smtpUser = config.smtpUser.trim();
  const smtpPassword = config.smtpPassword.trim();
  const smtpPort = Number.parseInt(config.smtpPort, 10);

  if (!smtpHost || !smtpUser || !smtpPassword || !Number.isFinite(smtpPort)) {
    throw new Error('SMTP configuration is incomplete');
  }

  // Port 465 expects implicit TLS, while 587 is STARTTLS.
  const secure = smtpPort === 465 ? true : config.smtpSecure && smtpPort !== 587;
  const requireTLS = smtpPort === 587 || !secure;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  const payload = buildTestEmailPayload(config, recipient);
  const result = await transporter.sendMail(payload);
  return typeof result.messageId === 'string' ? result.messageId : null;
}

async function sendViaSendgrid(
  config: OutboundEmailConfigRecord,
  recipient: string,
): Promise<string | null> {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error('SendGrid API key is missing');
  }

  const payload = buildTestEmailPayload(config, recipient);
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: config.fromEmail.trim(), name: config.fromName.trim() || undefined },
      personalizations: [{ to: [{ email: recipient }] }],
      subject: payload.subject,
      content: [{ type: 'text/plain', value: payload.text }],
      ...(hasText(config.replyTo) ? { reply_to: { email: config.replyTo.trim() } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SendGrid rejected message: ${response.status} ${detail.slice(0, 300)}`);
  }

  return response.headers.get('x-message-id');
}

async function sendViaResend(
  config: OutboundEmailConfigRecord,
  recipient: string,
): Promise<string | null> {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error('Resend API key is missing');
  }

  const payload = buildTestEmailPayload(config, recipient);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: buildFromHeader(config),
      to: [recipient],
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      ...(hasText(config.replyTo) ? { reply_to: config.replyTo.trim() } : {}),
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof body?.message === 'string' ? body.message : JSON.stringify(body);
    throw new Error(`Resend rejected message: ${response.status} ${detail.slice(0, 300)}`);
  }

  return typeof body?.id === 'string' ? body.id : null;
}

async function sendOutboundTestEmail(
  config: OutboundEmailConfigRecord,
  recipient: string,
): Promise<string | null> {
  if (!hasUsableEmail(config.fromEmail)) {
    throw new Error('fromEmail is invalid');
  }
  if (!hasUsableEmail(recipient)) {
    throw new Error('Test recipient email is invalid');
  }

  if (config.provider === 'sendgrid') {
    return sendViaSendgrid(config, recipient);
  }

  if (config.provider === 'resend') {
    return sendViaResend(config, recipient);
  }

  return sendViaSmtp(config, recipient);
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
        bs.login_overlay_color,
        bs.login_overlay_opacity::float8 AS login_overlay_opacity,
        bs.login_welcome_message,
        bs.login_headline,
        bs.login_support_message,
        bs.image_welcome_message,
        bs.image_login_headline,
        bs.image_login_support_message,
        bs.login_background_image_url,
        bs.login_background_image_urls,
        bs.login_image_urls,
        bs.image_welcome_messages,
        bs.show_platform_name,
        bs.show_welcome_message,
        bs.show_login_headline,
        bs.show_login_support_message,
        bs.show_image_welcome_message,
        bs.show_image_login_headline,
        bs.show_image_login_support_message,
        bs.show_loader_text,
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

async function persistBrandingSettings(
  client: PoolClient,
  actor: AuthUser,
  input: Partial<BrandingSettings>,
  options?: {
    reason?: BrandingRevisionReason;
    sourceRevisionId?: string | null;
  },
): Promise<BrandingUpdateResult> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const reason = options?.reason ?? 'manual_update';
  const sourceRevisionId = options?.sourceRevisionId ?? null;

  const current = await getBrandingSettings(client, actor);
  const currentSnapshot = toBrandingSettingsSnapshot(current);
  const next = normalizeBrandingInput(current, input);
  const nextSnapshot = toBrandingSettingsSnapshot(next);
  const { changedFields, changes } = computeBrandingChanges(currentSnapshot, nextSnapshot);

  if (changedFields.length === 0) {
    return {
      settings: current,
      previousSettings: current,
      changedFields,
      changes,
      revisionId: null,
      reason,
      sourceRevisionId,
    };
  }

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
        login_overlay_color,
        login_overlay_opacity,
        login_welcome_message,
        login_headline,
        login_support_message,
        image_welcome_message,
        image_login_headline,
        image_login_support_message,
        login_background_image_url,
        login_background_image_urls,
        login_image_urls,
        image_welcome_messages,
        show_platform_name,
        show_welcome_message,
        show_login_headline,
        show_login_support_message,
        show_image_welcome_message,
        show_image_login_headline,
        show_image_login_support_message,
        show_loader_text,
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
        $18,
        $19,
        $20,
        $21,
        $22,
        NULLIF($23, ''),
        $24::text[],
        $25::text[],
        $26::text[],
        $27,
        $28,
        $29,
        $30,
        $31,
        $32,
        $33,
        $34,
        $35,
        $36,
        $37::uuid,
        $37::uuid
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
          login_overlay_color = EXCLUDED.login_overlay_color,
          login_overlay_opacity = EXCLUDED.login_overlay_opacity,
          login_welcome_message = EXCLUDED.login_welcome_message,
          login_headline = EXCLUDED.login_headline,
          login_support_message = EXCLUDED.login_support_message,
          image_welcome_message = EXCLUDED.image_welcome_message,
          image_login_headline = EXCLUDED.image_login_headline,
          image_login_support_message = EXCLUDED.image_login_support_message,
          login_background_image_url = EXCLUDED.login_background_image_url,
          login_background_image_urls = EXCLUDED.login_background_image_urls,
          login_image_urls = EXCLUDED.login_image_urls,
          image_welcome_messages = EXCLUDED.image_welcome_messages,
          show_platform_name = EXCLUDED.show_platform_name,
          show_welcome_message = EXCLUDED.show_welcome_message,
          show_login_headline = EXCLUDED.show_login_headline,
          show_login_support_message = EXCLUDED.show_login_support_message,
          show_image_welcome_message = EXCLUDED.show_image_welcome_message,
          show_image_login_headline = EXCLUDED.show_image_login_headline,
          show_image_login_support_message = EXCLUDED.show_image_login_support_message,
          show_loader_text = EXCLUDED.show_loader_text,
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
        login_overlay_color,
        login_overlay_opacity::float8 AS login_overlay_opacity,
        login_welcome_message,
        login_headline,
        login_support_message,
        image_welcome_message,
        image_login_headline,
        image_login_support_message,
        login_background_image_url,
        login_background_image_urls,
        login_image_urls,
        image_welcome_messages,
        show_platform_name,
        show_welcome_message,
        show_login_headline,
        show_login_support_message,
        show_image_welcome_message,
        show_image_login_headline,
        show_image_login_support_message,
        show_loader_text,
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
      next.loginOverlayColor,
      next.loginOverlayOpacity,
      next.welcomeMessage,
      next.loginHeadline,
      next.loginSupportMessage,
      next.imageWelcomeMessage,
      next.imageLoginHeadline,
      next.imageLoginSupportMessage,
      next.loginBackgroundImageUrl,
      next.loginBackgroundImageUrls,
      next.loginImageUrls,
      next.imageWelcomeMessages,
      next.showPlatformName,
      next.showWelcomeMessage,
      next.showLoginHeadline,
      next.showLoginSupportMessage,
      next.showImageWelcomeMessage,
      next.showImageLoginHeadline,
      next.showImageLoginSupportMessage,
      next.showLoaderText,
      next.customCss,
      next.presetCode,
      actor.userId,
    ],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to persist branding settings');
  }

  const settings = mapBrandingRow(row);
  const persistedSnapshot = toBrandingSettingsSnapshot(settings);
  const revisionId = await writeBrandingRevision(client, {
    organizationId: settings.organizationId,
    brandingId: settings.brandingId,
    reason,
    sourceRevisionId,
    changedFields,
    snapshot: persistedSnapshot,
    changeSummary: {
      changedFields,
      changes,
      reason,
      sourceRevisionId,
      updatedAt: settings.updatedAt,
    },
    actorUserId: actor.userId,
  });

  return {
    settings,
    previousSettings: current,
    changedFields,
    changes,
    revisionId,
    reason,
    sourceRevisionId,
  };
}

export async function updateBrandingSettings(
  client: PoolClient,
  actor: AuthUser,
  input: Partial<BrandingSettings>,
): Promise<BrandingUpdateResult> {
  return persistBrandingSettings(client, actor, input, { reason: 'manual_update' });
}

export async function listBrandingRevisions(
  client: PoolClient,
  actor: AuthUser,
  limit = 40,
): Promise<BrandingRevisionRecord[]> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const organizationId = await resolveOrganizationId(client, actor.userId);
  const requestedLimit = Number.isFinite(limit) ? limit : 40;
  const safeLimit = Math.min(Math.max(requestedLimit, 1), 200);
  const { rows } = await client.query<BrandingRevisionRow>(
    `
      SELECT
        br.revision_id::text,
        br.branding_id::text,
        br.organization_id::text,
        br.reason,
        br.source_revision_id::text,
        br.changed_fields,
        br.snapshot,
        br.change_summary,
        br.created_by::text,
        u.display_name AS created_by_name,
        br.created_at::text
      FROM app_admin.branding_revisions br
      LEFT JOIN app_core.users u ON u.user_id = br.created_by
      WHERE br.organization_id = $1::uuid
      ORDER BY br.created_at DESC
      LIMIT $2
    `,
    [organizationId, safeLimit],
  );

  return rows.map(mapBrandingRevisionRow);
}

export async function revertBrandingRevision(
  client: PoolClient,
  actor: AuthUser,
  revisionId: string,
): Promise<BrandingUpdateResult> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const organizationId = await resolveOrganizationId(client, actor.userId);
  const { rows } = await client.query<BrandingRevisionRow>(
    `
      SELECT
        br.revision_id::text,
        br.branding_id::text,
        br.organization_id::text,
        br.reason,
        br.source_revision_id::text,
        br.changed_fields,
        br.snapshot,
        br.change_summary,
        br.created_by::text,
        u.display_name AS created_by_name,
        br.created_at::text
      FROM app_admin.branding_revisions br
      LEFT JOIN app_core.users u ON u.user_id = br.created_by
      WHERE br.organization_id = $1::uuid
        AND br.revision_id = $2::uuid
      LIMIT 1
    `,
    [organizationId, revisionId],
  );

  const row = rows[0];
  if (!row) {
    throw new Error('Branding revision not found');
  }

  const revision = mapBrandingRevisionRow(row);
  return persistBrandingSettings(client, actor, revision.snapshot, {
    reason: 'revert',
    sourceRevisionId: revision.revisionId,
  });
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
      bs.login_overlay_color,
      bs.login_overlay_opacity::float8 AS login_overlay_opacity,
      bs.login_welcome_message,
      bs.login_headline,
      bs.login_support_message,
      bs.image_welcome_message,
      bs.image_login_headline,
      bs.image_login_support_message,
      bs.login_background_image_url,
      bs.login_background_image_urls,
      bs.login_image_urls,
      bs.image_welcome_messages,
      bs.show_platform_name,
      bs.show_welcome_message,
      bs.show_login_headline,
      bs.show_login_support_message,
      bs.show_image_welcome_message,
      bs.show_image_login_headline,
      bs.show_image_login_support_message,
      bs.show_loader_text,
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
      bs.login_overlay_color,
      bs.login_overlay_opacity::float8 AS login_overlay_opacity,
      bs.login_welcome_message,
      bs.login_headline,
      bs.login_support_message,
      bs.image_welcome_message,
      bs.image_login_headline,
      bs.image_login_support_message,
      bs.login_background_image_url,
      bs.login_background_image_urls,
      bs.login_image_urls,
      bs.image_welcome_messages,
      bs.show_platform_name,
      bs.show_welcome_message,
      bs.show_login_headline,
      bs.show_login_support_message,
      bs.show_image_welcome_message,
      bs.show_image_login_headline,
      bs.show_image_login_support_message,
      bs.show_loader_text,
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

  const messageId = await sendOutboundTestEmail(settings.outboundEmail, recipient);

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
    messageId,
  };
}
