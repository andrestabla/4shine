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

export const BRANDING_PRESET_CODES = ['corporativo', 'energetico', 'tech', 'custom'] as const;
export type BrandingPresetCode = (typeof BRANDING_PRESET_CODES)[number];

export const LOGIN_LAYOUT_OPTIONS = ['image_right', 'image_left', 'centered_image'] as const;
export type LoginLayout = (typeof LOGIN_LAYOUT_OPTIONS)[number];

export const LOGIN_LAYOUT_LABELS: Record<LoginLayout, string> = {
  image_right: 'Imagen derecha / Formulario izquierda',
  image_left: 'Imagen izquierda / Formulario derecha',
  centered_image: 'Login centrado con imagen de fondo',
};

export interface BrandingFontOption {
  value: string;
  label: string;
  googleFamily: string;
  cssStack: string;
}

export const BRANDING_FONT_OPTIONS: BrandingFontOption[] = [
  { value: 'Inter', label: 'Inter (Estándar)', googleFamily: 'Inter:wght@400;500;600;700;800', cssStack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { value: 'Poppins', label: 'Poppins', googleFamily: 'Poppins:wght@400;500;600;700;800', cssStack: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
  { value: 'Roboto', label: 'Roboto', googleFamily: 'Roboto:wght@400;500;700;900', cssStack: 'Roboto, ui-sans-serif, system-ui, sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', googleFamily: 'Montserrat:wght@400;500;600;700;800', cssStack: 'Montserrat, ui-sans-serif, system-ui, sans-serif' },
  { value: 'Nunito Sans', label: 'Nunito Sans', googleFamily: 'Nunito+Sans:wght@400;500;700;800', cssStack: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif' },
] as const;

export interface BrandingPresetDefinition {
  code: Exclude<BrandingPresetCode, 'custom'>;
  label: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  typography: string;
  borderRadiusRem: number;
}

export const BRANDING_PRESETS: BrandingPresetDefinition[] = [
  {
    code: 'corporativo',
    label: 'Corporativo',
    description: 'Inter, 0.2rem',
    primaryColor: '#1E293B',
    secondaryColor: '#475569',
    accentColor: '#F59E0B',
    typography: 'Inter',
    borderRadiusRem: 0.2,
  },
  {
    code: 'energetico',
    label: 'Energético',
    description: 'Poppins, 1rem',
    primaryColor: '#F97316',
    secondaryColor: '#334155',
    accentColor: '#F59E0B',
    typography: 'Poppins',
    borderRadiusRem: 1,
  },
  {
    code: 'tech',
    label: 'Tech',
    description: 'Roboto, 0px',
    primaryColor: '#0EA5E9',
    secondaryColor: '#0F172A',
    accentColor: '#22C55E',
    typography: 'Roboto',
    borderRadiusRem: 0,
  },
] as const;

export interface BrandingSettings {
  platformName: string;
  institutionTimezone: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  loaderText: string;
  loaderAssetUrl: string;
  typography: string;
  borderRadiusRem: number;
  pageMaxWidth: string;
  loginLayout: LoginLayout;
  loginOverlayColor: string;
  loginOverlayOpacity: number;
  welcomeMessage: string;
  loginHeadline: string;
  loginSupportMessage: string;
  loginBackgroundImageUrl: string;
  showPlatformName: boolean;
  showWelcomeMessage: boolean;
  showLoginHeadline: boolean;
  showLoginSupportMessage: boolean;
  showLoaderText: boolean;
  customCss: string;
  presetCode: BrandingPresetCode;
}

export interface BrandingSettingsRecord extends BrandingSettings {
  brandingId: string | null;
  organizationId: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export const BRANDING_REVISION_REASONS = ['manual_update', 'revert'] as const;
export type BrandingRevisionReason = (typeof BRANDING_REVISION_REASONS)[number];

export interface BrandingRevisionRecord {
  revisionId: string;
  brandingId: string | null;
  organizationId: string;
  reason: BrandingRevisionReason;
  sourceRevisionId: string | null;
  changedFields: string[];
  snapshot: BrandingSettings;
  changeSummary: Record<string, unknown>;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface BrandingRuntimeTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    hover: string;
    focus: string;
  };
  typography: {
    family: string;
    cssStack: string;
  };
  shape: {
    borderRadiusRem: number;
  };
  layout: {
    pageMaxWidth: string;
    loginLayout: LoginLayout;
    timezone: string;
    loginBackgroundImageUrl: string;
    loginOverlayColor: string;
    loginOverlayOpacity: number;
  };
  assets: {
    logoUrl: string;
    faviconUrl: string;
    loaderAssetUrl: string;
  };
  text: {
    platformName: string;
    welcomeMessage: string;
    loginHeadline: string;
    loginSupportMessage: string;
    loaderText: string;
    visibility: {
      platformName: boolean;
      welcomeMessage: boolean;
      loginHeadline: boolean;
      loginSupportMessage: boolean;
      loaderText: boolean;
    };
  };
}

export interface BrandingPublicPayload {
  settings: BrandingSettingsRecord;
  tokens: BrandingRuntimeTokens;
  mobile: BrandingRuntimeTokens;
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
  institutionTimezone: 'UTC',
  primaryColor: '#0f172a',
  secondaryColor: '#475569',
  accentColor: '#f59e0b',
  logoUrl: '',
  faviconUrl: '',
  loaderText: 'Cargando 4Shine...',
  loaderAssetUrl: '',
  typography: 'Inter',
  borderRadiusRem: 1,
  pageMaxWidth: '1260px',
  loginLayout: 'image_right',
  loginOverlayColor: '#0f172a',
  loginOverlayOpacity: 0.45,
  welcomeMessage: 'Inicia sesión con tu cuenta corporativa.',
  loginHeadline: 'Bienvenidos a una nueva experiencia de aprendizaje',
  loginSupportMessage: 'Pensado para plataforma web y app móvil.',
  loginBackgroundImageUrl: '',
  showPlatformName: true,
  showWelcomeMessage: true,
  showLoginHeadline: true,
  showLoginSupportMessage: true,
  showLoaderText: true,
  customCss: '',
  presetCode: 'corporativo',
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

export function findBrandingFont(value: string): BrandingFontOption {
  return (
    BRANDING_FONT_OPTIONS.find((font) => font.value.toLowerCase() === value.toLowerCase()) ??
    BRANDING_FONT_OPTIONS[0]
  );
}

export function clampBorderRadiusRem(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BRANDING_SETTINGS.borderRadiusRem;
  return Math.min(3, Math.max(0, Math.round(value * 100) / 100));
}

export function isValidCssSizeToken(value: string): boolean {
  return /^[0-9]+(px|rem|vw|%)$/i.test(value.trim());
}

export function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BRANDING_SETTINGS.loginOverlayOpacity;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
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
