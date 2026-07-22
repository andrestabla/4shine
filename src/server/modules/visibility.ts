import type { PoolClient } from 'pg';
import { ALL_MODULE_KEYS, PROTECTED_MODULE_KEYS } from '@/features/modulos/catalog';

/**
 * Lectura de bajo nivel del encendido/apagado de módulos.
 *
 * Vive aquí y no en features/modulos/service.ts para romper el ciclo de
 * importación: el servicio necesita requireModulePermission, y
 * requireModulePermission necesita consultar la visibilidad.
 */
export async function readModuleVisibilityMap(
  client: PoolClient,
): Promise<Record<string, boolean>> {
  const map: Record<string, boolean> = {};
  try {
    const { rows } = await client.query<{ module_key: string; is_enabled: boolean }>(
      `SELECT module_key, is_enabled FROM app_admin.module_visibility`,
    );
    for (const row of rows) {
      if (ALL_MODULE_KEYS.has(row.module_key)) map[row.module_key] = row.is_enabled;
    }
  } catch {
    // Tabla aún no migrada: todo encendido (comportamiento previo).
  }
  return map;
}

/** Un módulo protegido siempre está encendido, pase lo que pase en la BD. */
export function isModuleEnabledIn(map: Record<string, boolean>, key: string): boolean {
  if (PROTECTED_MODULE_KEYS.has(key)) return true;
  return map[key] !== false;
}
