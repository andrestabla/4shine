import type { PoolClient } from 'pg';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import {
  ROLE_CODES,
  type ModuleRecord,
  type RoleCode,
  type RolePermissionCell,
  type RolePermissionsMatrix,
  type UpdateRolePermissionInput,
} from './types';

function assertActorIsAdmin(actor: AuthUser): void {
  if (actor.role !== 'admin') {
    throw new ForbiddenError('Solo el administrador puede gestionar roles y permisos.');
  }
}

interface ModuleRow {
  module_code: string;
  module_name: string;
  description: string;
  is_core: boolean;
}

interface PermissionRow {
  role_code: RoleCode;
  module_code: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_moderate: boolean;
  can_manage: boolean;
}

function toModuleRecord(row: ModuleRow): ModuleRecord {
  return {
    moduleCode: row.module_code,
    moduleName: row.module_name,
    description: row.description,
    isCore: row.is_core,
  };
}

function toPermissionCell(row: PermissionRow): RolePermissionCell {
  return {
    roleCode: row.role_code,
    moduleCode: row.module_code,
    canView: row.can_view,
    canCreate: row.can_create,
    canUpdate: row.can_update,
    canDelete: row.can_delete,
    canApprove: row.can_approve,
    canModerate: row.can_moderate,
    canManage: row.can_manage,
  };
}

export async function getRolePermissionsMatrix(
  client: PoolClient,
  actor: AuthUser,
): Promise<RolePermissionsMatrix> {
  assertActorIsAdmin(actor);
  await requireModulePermission(client, 'usuarios', 'manage');

  const { rows: modules } = await client.query<ModuleRow>(
    `SELECT module_code, module_name, description, is_core
     FROM app_auth.modules
     ORDER BY is_core DESC, module_name`,
  );

  const { rows: permissions } = await client.query<PermissionRow>(
    `SELECT role_code, module_code,
            can_view, can_create, can_update, can_delete,
            can_approve, can_moderate, can_manage
     FROM app_auth.role_module_permissions`,
  );

  return {
    roles: ROLE_CODES,
    modules: modules.map(toModuleRecord),
    permissions: permissions.map(toPermissionCell),
  };
}

export async function updateRolePermission(
  client: PoolClient,
  actor: AuthUser,
  input: UpdateRolePermissionInput,
): Promise<RolePermissionCell> {
  assertActorIsAdmin(actor);
  await requireModulePermission(client, 'usuarios', 'manage');

  if (!ROLE_CODES.includes(input.roleCode)) {
    throw new Error(`Rol inválido: ${input.roleCode}`);
  }

  // Guardrail: el admin no puede revocarse a sí mismo los permisos de gestionar usuarios.
  if (input.roleCode === 'admin' && input.moduleCode === 'usuarios') {
    const dangerous = input.canManage === false || input.canView === false;
    if (dangerous) {
      throw new Error('No se puede revocar el acceso de administración sobre Usuarios al rol admin.');
    }
  }

  const { rows: existing } = await client.query<PermissionRow>(
    `SELECT role_code, module_code,
            can_view, can_create, can_update, can_delete,
            can_approve, can_moderate, can_manage
     FROM app_auth.role_module_permissions
     WHERE role_code = $1 AND module_code = $2
     LIMIT 1`,
    [input.roleCode, input.moduleCode],
  );

  const current = existing[0]
    ? toPermissionCell(existing[0])
    : {
        roleCode: input.roleCode,
        moduleCode: input.moduleCode,
        canView: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canApprove: false,
        canModerate: false,
        canManage: false,
      };

  const merged: RolePermissionCell = {
    ...current,
    canView: input.canView ?? current.canView,
    canCreate: input.canCreate ?? current.canCreate,
    canUpdate: input.canUpdate ?? current.canUpdate,
    canDelete: input.canDelete ?? current.canDelete,
    canApprove: input.canApprove ?? current.canApprove,
    canModerate: input.canModerate ?? current.canModerate,
    canManage: input.canManage ?? current.canManage,
  };

  await client.query(
    `INSERT INTO app_auth.role_module_permissions
       (role_code, module_code,
        can_view, can_create, can_update, can_delete,
        can_approve, can_moderate, can_manage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (role_code, module_code) DO UPDATE
     SET can_view    = EXCLUDED.can_view,
         can_create  = EXCLUDED.can_create,
         can_update  = EXCLUDED.can_update,
         can_delete  = EXCLUDED.can_delete,
         can_approve = EXCLUDED.can_approve,
         can_moderate= EXCLUDED.can_moderate,
         can_manage  = EXCLUDED.can_manage`,
    [
      merged.roleCode,
      merged.moduleCode,
      merged.canView,
      merged.canCreate,
      merged.canUpdate,
      merged.canDelete,
      merged.canApprove,
      merged.canModerate,
      merged.canManage,
    ],
  );

  return merged;
}
