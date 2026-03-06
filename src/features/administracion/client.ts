import { requestApi } from '@/lib/api-client';
import type {
  BrandingPublicPayload,
  BrandingRevisionRecord,
  BrandingSettings,
  BrandingSettingsRecord,
  IntegrationsSettingsRecord,
  OutboundEmailConfig,
} from './types';

export type {
  BrandingFontOption,
  BrandingPresetCode,
  BrandingPresetDefinition,
  BrandingRevisionReason,
  BrandingRevisionRecord,
  BrandingPublicPayload,
  BrandingRuntimeTokens,
  BrandingSettings,
  BrandingSettingsRecord,
  IntegrationConfigRecord,
  IntegrationKey,
  IntegrationsSettingsRecord,
  LoginLayout,
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

export async function getPublicBrandingSettings(
  organizationId?: string,
): Promise<BrandingPublicPayload> {
  const params = new URLSearchParams();
  if (organizationId) params.set('organizationId', organizationId);
  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return requestApi<BrandingPublicPayload>(`/api/v1/public/branding${suffix}`);
}

export async function updateBrandingSettings(
  input: Partial<BrandingSettings>,
): Promise<BrandingSettingsRecord> {
  return requestApi<BrandingSettingsRecord>('/api/v1/modules/administracion/branding', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function listBrandingRevisions(limit = 40): Promise<BrandingRevisionRecord[]> {
  const safeLimit = Math.min(Math.max(Number(limit) || 40, 1), 200);
  return requestApi<BrandingRevisionRecord[]>(
    `/api/v1/modules/administracion/branding/revisions?limit=${safeLimit}`,
  );
}

export async function revertBrandingRevision(revisionId: string): Promise<BrandingSettingsRecord> {
  return requestApi<BrandingSettingsRecord>('/api/v1/modules/administracion/branding/revisions/revert', {
    method: 'POST',
    body: JSON.stringify({ revisionId }),
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
