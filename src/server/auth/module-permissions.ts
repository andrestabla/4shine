import type { PoolClient } from 'pg';
import type { ModuleCode, PermissionAction } from '@/lib/permissions';
import { MODULE_KEY_BY_CODE } from '@/features/modulos/catalog';
import { isModuleEnabledIn, readModuleVisibilityMap } from '@/server/modules/visibility';

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
  const roleContext = await client.query<{ role_code: string | null }>(
    `SELECT current_setting('app.current_role', true) AS role_code`,
  );
  const contextRole = (roleContext.rows[0]?.role_code ?? '').trim().toLowerCase();

  // Admin = superuser. Acceso total a toda la plataforma SIN consultar la
  // tabla role_module_permissions. Esto blinda contra cualquier caso donde
  // un módulo nuevo se agregue al sistema sin que su seed le otorgue
  // permisos explícitos a admin. La verdad es: "si eres admin, puedes todo".
  if (contextRole === 'admin') return true;

  // Módulo apagado desde /administracion/modulos: se cierra también su API, no
  // solo el enlace del menú. El admin ya salió arriba, así que conserva acceso
  // para poder reactivarlo.
  const moduleKey = MODULE_KEY_BY_CODE.get(moduleCode);
  if (moduleKey) {
    const visibility = await readModuleVisibilityMap(client);
    if (!isModuleEnabledIn(visibility, moduleKey)) return false;
  }

  if (contextRole === 'invitado') {
    if (moduleCode !== 'descubrimiento') return false;
    return action === 'view' || action === 'create' || action === 'update';
  }

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
