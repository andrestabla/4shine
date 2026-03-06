'use client';

import React, { createContext, useContext } from 'react';
import {
  getPublicBrandingSettings,
  type BrandingSettings,
  type BrandingSettingsRecord,
  type BrandingRuntimeTokens,
} from '@/features/administracion/client';
import { DEFAULT_BRANDING_SETTINGS, findBrandingFont } from '@/features/administracion/types';
import { buildBrandingTokens } from '@/lib/branding';

interface BrandingContextType {
  branding: BrandingSettingsRecord;
  tokens: BrandingRuntimeTokens;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
  applyBranding: (next: BrandingSettings | BrandingSettingsRecord) => void;
}

const DEFAULT_BRANDING_RECORD: BrandingSettingsRecord = {
  brandingId: null,
  organizationId: '',
  createdAt: null,
  updatedAt: null,
  ...DEFAULT_BRANDING_SETTINGS,
};

const DEFAULT_TOKENS = buildBrandingTokens(DEFAULT_BRANDING_RECORD);

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

function isBrandingRecord(value: BrandingSettings | BrandingSettingsRecord): value is BrandingSettingsRecord {
  return 'brandingId' in value && 'organizationId' in value;
}

function toBrandingRecord(
  value: BrandingSettings | BrandingSettingsRecord,
  base: BrandingSettingsRecord,
): BrandingSettingsRecord {
  if (isBrandingRecord(value)) {
    return value;
  }

  return {
    ...base,
    ...value,
  };
}

function ensureStyleTag(id: string): HTMLStyleElement {
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);
  }
  return style;
}

function applyBrandingToDocument(
  branding: BrandingSettingsRecord,
  tokens: BrandingRuntimeTokens,
): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', tokens.colors.primary);
  root.style.setProperty('--brand-secondary', tokens.colors.secondary);
  root.style.setProperty('--brand-accent', tokens.colors.accent);
  root.style.setProperty('--brand-hover', tokens.colors.hover);
  root.style.setProperty('--brand-focus', tokens.colors.focus);
  root.style.setProperty('--brand-radius-rem', String(tokens.shape.borderRadiusRem));
  root.style.setProperty('--brand-page-max-width', tokens.layout.pageMaxWidth);
  root.style.setProperty('--brand-font-family', tokens.typography.cssStack);
  root.style.setProperty('--brand-login-layout', tokens.layout.loginLayout);
  root.setAttribute('data-brand-login-layout', tokens.layout.loginLayout);

  const font = findBrandingFont(branding.typography);
  const fontLinkId = '__branding_google_font';
  let fontLink = document.getElementById(fontLinkId) as HTMLLinkElement | null;
  if (!fontLink) {
    fontLink = document.createElement('link');
    fontLink.id = fontLinkId;
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }
  fontLink.href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;

  if (branding.faviconUrl.trim().length > 0) {
    let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = branding.faviconUrl;
  }

  if (branding.platformName.trim().length > 0) {
    document.title = branding.platformName;
  }

  const customCssStyle = ensureStyleTag('__branding_custom_css');
  customCssStyle.textContent = branding.customCss;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = React.useState<BrandingSettingsRecord>(DEFAULT_BRANDING_RECORD);
  const [tokens, setTokens] = React.useState<BrandingRuntimeTokens>(DEFAULT_TOKENS);
  const [isLoading, setIsLoading] = React.useState(true);

  const applyBranding = React.useCallback((next: BrandingSettings | BrandingSettingsRecord) => {
    setBranding((prev) => {
      const record = toBrandingRecord(next, prev);
      const nextTokens = buildBrandingTokens(record);
      setTokens(nextTokens);
      applyBrandingToDocument(record, nextTokens);
      return record;
    });
  }, []);

  const refreshBranding = React.useCallback(async () => {
    try {
      const payload = await getPublicBrandingSettings();
      applyBranding(payload.settings);
    } catch {
      applyBranding(DEFAULT_BRANDING_RECORD);
    }
  }, [applyBranding]);

  React.useEffect(() => {
    let active = true;

    const hydrate = async () => {
      setIsLoading(true);
      await refreshBranding();
      if (active) setIsLoading(false);
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, [refreshBranding]);

  const value = React.useMemo(
    () => ({
      branding,
      tokens,
      isLoading,
      refreshBranding,
      applyBranding,
    }),
    [branding, tokens, isLoading, refreshBranding, applyBranding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
}
