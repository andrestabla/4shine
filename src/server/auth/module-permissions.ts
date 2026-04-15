import type { PoolClient } from 'pg';
import type { ModuleCode, PermissionAction } from '@/lib/permissions';

export class ForbiddenError extends Error {
  readonly statusCode: number;

  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

export async function hasModulePermission(
  client: PoolClient,
  moduleCode: ModuleCode,
  action: PermissionAction,
): Promise<boolean> {
  const invitedContext = await client.query<{ user_id: string | null }>(
    `SELECT current_setting('app.current_user_id', true) AS user_id`,
  );
  const contextUserId = invitedContext.rows[0]?.user_id ?? '';
  if (contextUserId.startsWith('invited:')) {
    if (moduleCode !== 'descubrimiento') return false;
    return action === 'view' || action === 'create' || action === 'update';
  }

  const { rows } = await client.query<{ allowed: boolean }>(
    `SELECT app_auth.has_permission($1, $2) AS allowed`,
    [moduleCode, action],
  );

  return rows[0]?.allowed ?? false;
}

export async function requireModulePermission(
  client: PoolClient,
  moduleCode: ModuleCode,
  action: PermissionAction,
): Promise<void> {
  const allowed = await hasModulePermission(client, moduleCode, action);
  if (!allowed) {
    throw new ForbiddenError(`Missing permission ${moduleCode}:${action}`);
  }
}
