import {
  DEFAULT_BRANDING_SETTINGS,
  findBrandingFont,
  type BrandingRuntimeTokens,
  type BrandingSettings,
} from '@/features/administracion/types';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '').trim();
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${clampChannel(r).toString(16).padStart(2, '0')}${clampChannel(g)
    .toString(16)
    .padStart(2, '0')}${clampChannel(b).toString(16).padStart(2, '0')}`;
}

export function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  return HEX_PATTERN.test(trimmed) ? trimmed.toLowerCase() : fallback;
}

function mixColors(base: string, target: string, ratio: number): string {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);
  const alpha = Math.min(1, Math.max(0, ratio));

  return rgbToHex(
    baseRgb.r + (targetRgb.r - baseRgb.r) * alpha,
    baseRgb.g + (targetRgb.g - baseRgb.g) * alpha,
    baseRgb.b + (targetRgb.b - baseRgb.b) * alpha,
  );
}

export function deriveHoverColor(primary: string): string {
  return mixColors(primary, '#000000', 0.12);
}

export function deriveFocusColor(primary: string): string {
  return mixColors(primary, '#ffffff', 0.18);
}

export function buildBrandingTokens(settings: BrandingSettings): BrandingRuntimeTokens {
  const font = findBrandingFont(settings.typography);
  const primary = normalizeHexColor(settings.primaryColor, DEFAULT_BRANDING_SETTINGS.primaryColor);
  const secondary = normalizeHexColor(settings.secondaryColor, DEFAULT_BRANDING_SETTINGS.secondaryColor);
  const accent = normalizeHexColor(settings.accentColor, DEFAULT_BRANDING_SETTINGS.accentColor);

  return {
    colors: {
      primary,
      secondary,
      accent,
      hover: deriveHoverColor(primary),
      focus: deriveFocusColor(primary),
    },
    typography: {
      family: font.value,
      cssStack: font.cssStack,
    },
    shape: {
      borderRadiusRem: settings.borderRadiusRem,
    },
    layout: {
      pageMaxWidth: settings.pageMaxWidth,
      loginLayout: settings.loginLayout,
      timezone: settings.institutionTimezone,
      loginBackgroundImageUrl: settings.loginBackgroundImageUrl,
    },
    assets: {
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      loaderAssetUrl: settings.loaderAssetUrl,
    },
    text: {
      platformName: settings.platformName,
      welcomeMessage: settings.welcomeMessage,
      loginHeadline: settings.loginHeadline,
      loginSupportMessage: settings.loginSupportMessage,
      loaderText: settings.loaderText,
    },
  };
}
