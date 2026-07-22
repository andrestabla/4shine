import type { PoolClient } from 'pg';
import type { AuthUser } from '@/server/auth/types';
import { requireModulePermission } from '@/server/auth/module-permissions';
import {
  ALL_MODULE_KEYS,
  MODULE_CATALOG,
  PROTECTED_MODULE_KEYS,
  type ModuleCatalogEntry,
} from './catalog';
import { isModuleEnabledIn, readModuleVisibilityMap } from '@/server/modules/visibility';

export interface ModuleVisibilityEntry {
  key: string;
  label: string;
  description: string;
  path: string;
  isEnabled: boolean;
  isProtected: boolean;
  children: Array<{
    key: string;
    label: string;
    description: string;
    path: string;
    isEnabled: boolean;
  }>;
}

export interface UpdateModuleVisibilityInput {
  moduleKey: string;
  isEnabled: boolean;
}

function toEntry(entry: ModuleCatalogEntry, map: Record<string, boolean>): ModuleVisibilityEntry {
  return {
    key: entry.key,
    label: entry.label,
    description: entry.description,
    path: entry.path,
    isEnabled: isModuleEnabledIn(map, entry.key),
    isProtected: Boolean(entry.isProtected),
    children: (entry.children ?? []).map((child) => ({
      key: child.key,
      label: child.label,
      description: child.description,
      path: child.path,
      isEnabled: isModuleEnabledIn(map, child.key),
    })),
  };
}

/** Catálogo completo con su estado — para el panel de administración. */
export async function listModuleVisibility(
  client: PoolClient,
  _actor: AuthUser,
): Promise<ModuleVisibilityEntry[]> {
  await requireModulePermission(client, 'usuarios', 'manage');
  const map = await readModuleVisibilityMap(client);
  return MODULE_CATALOG.map((entry) => toEntry(entry, map));
}

export async function updateModuleVisibility(
  client: PoolClient,
  actor: AuthUser,
  input: UpdateModuleVisibilityInput,
): Promise<ModuleVisibilityEntry[]> {
  await requireModulePermission(client, 'usuarios', 'manage');

  if (!ALL_MODULE_KEYS.has(input.moduleKey)) {
    throw new Error(`Módulo desconocido: ${input.moduleKey}`);
  }
  if (PROTECTED_MODULE_KEYS.has(input.moduleKey) && !input.isEnabled) {
    throw new Error(
      'Ese módulo no se puede apagar: es la única vía para volver a encender los demás.',
    );
  }

  const { rows: orgRows } = await client.query<{ organization_id: string }>(
    `SELECT organization_id::text FROM app_core.users WHERE user_id = $1::uuid LIMIT 1`,
    [actor.userId],
  );
  const organizationId = orgRows[0]?.organization_id;
  if (!organizationId) throw new Error('No se pudo resolver la organización del administrador.');

  await client.query(
    `INSERT INTO app_admin.module_visibility (organization_id, module_key, is_enabled, updated_by)
     VALUES ($1::uuid, $2, $3, $4::uuid)
     ON CONFLICT (organization_id, module_key) DO UPDATE
       SET is_enabled = EXCLUDED.is_enabled,
           updated_by = EXCLUDED.updated_by,
           updated_at = now()`,
    [organizationId, input.moduleKey, input.isEnabled, actor.userId],
  );

  const map = await readModuleVisibilityMap(client);
  return MODULE_CATALOG.map((entry) => toEntry(entry, map));
}
