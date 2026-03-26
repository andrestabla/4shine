import type { PoolClient } from 'pg';
import type { IntegrationKey } from '@/features/administracion/types';

interface OrganizationRow {
  organization_id: string | null;
}

interface IntegrationRow {
  integration_id: string;
  enabled: boolean;
  secret_value: string | null;
  wizard_data: Record<string, unknown> | null;
}

export interface ResolvedIntegrationConfig {
  organizationId: string;
  integrationId: string;
  key: IntegrationKey;
  enabled: boolean;
  secretValue: string;
  wizardData: Record<string, string>;
}

function normalizeWizardData(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const output: Record<string, string> = {};
  for (const [key, currentValue] of Object.entries(value as Record<string, unknown>)) {
    if (currentValue === null || currentValue === undefined) continue;
    output[key] = String(currentValue).trim();
  }
  return output;
}

export async function resolveOrganizationIdForActor(
  client: PoolClient,
  actorUserId: string,
): Promise<string> {
  const { rows } = await client.query<OrganizationRow>(
    `
      SELECT u.organization_id::text
      FROM app_core.users u
      WHERE u.user_id = $1::uuid
      LIMIT 1
    `,
    [actorUserId],
  );

  const organizationId = rows[0]?.organization_id;
  if (organizationId) return organizationId;

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
    throw new Error('No organization found to resolve integration configuration');
  }

  return fallbackOrganizationId;
}

export async function getIntegrationConfigForActor(
  client: PoolClient,
  actorUserId: string,
  integrationKey: IntegrationKey,
): Promise<ResolvedIntegrationConfig | null> {
  const organizationId = await resolveOrganizationIdForActor(client, actorUserId);

  const { rows } = await client.query<IntegrationRow>(
    `
      SELECT
        ic.integration_id::text,
        ic.enabled,
        ic.secret_value,
        ic.wizard_data
      FROM app_admin.integration_configs ic
      WHERE ic.organization_id = $1::uuid
        AND ic.integration_key = $2
      LIMIT 1
    `,
    [organizationId, integrationKey],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    organizationId,
    integrationId: row.integration_id,
    key: integrationKey,
    enabled: row.enabled,
    secretValue: row.secret_value?.trim() ?? '',
    wizardData: normalizeWizardData(row.wizard_data),
  };
}
