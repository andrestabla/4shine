import type { PoolClient } from 'pg';
import { MODULE_CODES, type ModuleCode } from '@/lib/permissions';
import type { AuthUser } from '@/server/auth/types';
import { withClient, withRoleContext } from '@/server/db/pool';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_MODULE_CODES = new Set<string>(MODULE_CODES);

export interface AuditLogInput {
  actorUserId?: string | null;
  action: string;
  moduleCode?: ModuleCode | null;
  entityTable: string;
  entityId?: string | null;
  changeSummary?: Record<string, unknown>;
}

function normalizeModuleCode(moduleCode?: string | null): string | null {
  if (!moduleCode) return null;
  return VALID_MODULE_CODES.has(moduleCode) ? moduleCode : null;
}

function normalizeEntityId(entityId?: string | null): string | null {
  if (!entityId) return null;
  return UUID_PATTERN.test(entityId) ? entityId : null;
}

function sanitizeSummary(value?: Record<string, unknown>): Record<string, unknown> {
  if (!value) return {};

  const output: Record<string, unknown> = {};
  for (const [key, currentValue] of Object.entries(value)) {
    if (currentValue === undefined) continue;
    output[key] = currentValue;
  }
  return output;
}

export function buildRequestSummary(
  request: Request,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? null;

  return sanitizeSummary({
    method: request.method,
    path: url.pathname,
    query: Object.keys(query).length ? query : undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    ipAddress: ipAddress ?? undefined,
    ...extra,
  });
}

export async function writeAuditLog(client: PoolClient, input: AuditLogInput): Promise<void> {
  await client.query(
    `
      INSERT INTO app_admin.audit_logs (
        actor_user_id,
        action,
        module_code,
        entity_table,
        entity_id,
        change_summary
      )
      VALUES ($1, $2, $3, $4, $5::uuid, $6::jsonb)
    `,
    [
      input.actorUserId ?? null,
      input.action,
      normalizeModuleCode(input.moduleCode ?? null),
      input.entityTable,
      normalizeEntityId(input.entityId ?? null),
      JSON.stringify(sanitizeSummary(input.changeSummary)),
    ],
  );
}

export async function recordAuditEvent(
  input: AuditLogInput,
  actor?: AuthUser | null,
): Promise<void> {
  await withClient((client) => {
    if (actor) {
      return withRoleContext(client, actor.userId, actor.role, () =>
        writeAuditLog(client, {
          ...input,
          actorUserId: input.actorUserId ?? actor.userId,
        }),
      );
    }

    return writeAuditLog(client, {
      ...input,
      actorUserId: input.actorUserId ?? null,
    });
  });
}
