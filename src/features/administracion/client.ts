import { requestApi } from '@/lib/api-client';
import type {
  BrandingSettings,
  BrandingSettingsRecord,
  IntegrationsSettingsRecord,
  OutboundEmailConfig,
} from './types';

export type {
  BrandingSettings,
  BrandingSettingsRecord,
  IntegrationConfigRecord,
  IntegrationKey,
  IntegrationsSettingsRecord,
  OutboundEmailConfig,
  OutboundEmailConfigRecord,
  OutboundEmailProvider,
} from './types';

export interface UpdateIntegrationsInput {
  integrations?: IntegrationsSettingsRecord['integrations'];
  outboundEmail?: Partial<OutboundEmailConfig>;
}

export interface OutboundEmailTestResponse {
  queuedAt: string;
  recipient: string;
  provider: string;
}

export async function getBrandingSettings(): Promise<BrandingSettingsRecord> {
  return requestApi<BrandingSettingsRecord>('/api/v1/modules/administracion/branding');
}

export async function updateBrandingSettings(
  input: Partial<BrandingSettings>,
): Promise<BrandingSettingsRecord> {
  return requestApi<BrandingSettingsRecord>('/api/v1/modules/administracion/branding', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function getIntegrationsSettings(): Promise<IntegrationsSettingsRecord> {
  return requestApi<IntegrationsSettingsRecord>('/api/v1/modules/administracion/integraciones');
}

export async function updateIntegrationsSettings(
  input: UpdateIntegrationsInput,
): Promise<IntegrationsSettingsRecord> {
  return requestApi<IntegrationsSettingsRecord>('/api/v1/modules/administracion/integraciones', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function queueOutboundEmailTest(
  recipient?: string,
): Promise<OutboundEmailTestResponse> {
  return requestApi<OutboundEmailTestResponse>(
    '/api/v1/modules/administracion/integraciones/outbound-email/test',
    {
      method: 'POST',
      body: JSON.stringify({ recipient }),
    },
  );
}
