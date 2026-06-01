import { getPublicBrandingSettings } from '@/features/administracion/service';
import { withClient } from '@/server/db/pool';
import {
  buildBrandingTokens,
  DEFAULT_BRANDING_RECORD,
} from '@/lib/branding';
import type {
  BrandingRuntimeTokens,
  BrandingSettingsRecord,
} from '@/features/administracion/types';

export interface ServerBranding {
  settings: BrandingSettingsRecord;
  tokens: BrandingRuntimeTokens;
}

export async function loadServerBranding(): Promise<ServerBranding> {
  try {
    const settings = await withClient((client) => getPublicBrandingSettings(client));
    return { settings, tokens: buildBrandingTokens(settings) };
  } catch {
    return {
      settings: DEFAULT_BRANDING_RECORD,
      tokens: buildBrandingTokens(DEFAULT_BRANDING_RECORD),
    };
  }
}
