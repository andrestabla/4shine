export const INTEGRATION_CATALOG = [
  { key: 'google_meet', label: 'Google Meet', provider: 'Google Workspace' },
  { key: 'google_calendar', label: 'Google Calendar', provider: 'Google Workspace' },
  { key: 'r2', label: 'Cloudflare R2', provider: 'Cloudflare' },
  { key: 'gemini', label: 'Gemini', provider: 'Google AI' },
  { key: 'google_sso', label: 'SSO Google', provider: 'Google OAuth' },
  { key: 'openai', label: 'OpenAI', provider: 'OpenAI' },
] as const;

export type IntegrationKey = (typeof INTEGRATION_CATALOG)[number]['key'];

export const OUTBOUND_EMAIL_PROVIDERS = ['smtp', 'sendgrid', 'resend', 'ses'] as const;
export type OutboundEmailProvider = (typeof OUTBOUND_EMAIL_PROVIDERS)[number];

export interface BrandingSettings {
  platformName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  loaderText: string;
  typography: string;
}

export interface BrandingSettingsRecord extends BrandingSettings {
  brandingId: string | null;
  organizationId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface IntegrationConfigRecord {
  integrationId: string | null;
  key: IntegrationKey;
  label: string;
  provider: string;
  enabled: boolean;
  value: string;
  wizardData: Record<string, string>;
  lastConfiguredAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OutboundEmailConfig {
  enabled: boolean;
  provider: OutboundEmailProvider;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  apiKey: string;
  sesRegion: string;
  testRecipient: string;
}

export interface OutboundEmailConfigRecord extends OutboundEmailConfig {
  outboundEmailId: string | null;
  organizationId: string;
  createdAt: string | null;
  updatedAt: string | null;
  lastTestedAt: string | null;
}

export interface IntegrationsSettingsRecord {
  integrations: IntegrationConfigRecord[];
  outboundEmail: OutboundEmailConfigRecord;
}

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  platformName: '4Shine Platform',
  primaryColor: '#0f172a',
  accentColor: '#f59e0b',
  logoUrl: '',
  faviconUrl: '',
  loaderText: 'Cargando 4Shine...',
  typography: 'Instrument Sans',
};

export const DEFAULT_OUTBOUND_EMAIL_CONFIG: OutboundEmailConfig = {
  enabled: false,
  provider: 'smtp',
  fromName: '4Shine Platform',
  fromEmail: '',
  replyTo: '',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPassword: '',
  smtpSecure: false,
  apiKey: '',
  sesRegion: 'us-east-1',
  testRecipient: '',
};

export function hasText(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

export function requiredOutboundMissing(config: OutboundEmailConfig): string[] {
  const missing: string[] = [];

  if (!hasText(config.fromName)) missing.push('Nombre remitente');
  if (!hasText(config.fromEmail)) missing.push('Correo remitente');

  if (config.provider === 'smtp') {
    if (!hasText(config.smtpHost)) missing.push('SMTP Host');
    if (!hasText(config.smtpPort)) missing.push('SMTP Port');
    if (!hasText(config.smtpUser)) missing.push('SMTP Usuario');
    if (!hasText(config.smtpPassword)) missing.push('SMTP Password');
  } else {
    if (!hasText(config.apiKey)) missing.push('API Key proveedor');
    if (config.provider === 'ses' && !hasText(config.sesRegion)) missing.push('Región SES');
  }

  return missing;
}
