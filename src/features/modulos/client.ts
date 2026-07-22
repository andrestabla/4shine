import { requestApi } from '@/lib/api-client';
import type { ModuleVisibilityEntry } from './service';

export type { ModuleVisibilityEntry } from './service';

const ADMIN_BASE = '/api/v1/modules/administracion/modulos';

export async function listModuleVisibility(): Promise<ModuleVisibilityEntry[]> {
  return requestApi<ModuleVisibilityEntry[]>(ADMIN_BASE);
}

export async function setModuleEnabled(
  moduleKey: string,
  isEnabled: boolean,
): Promise<ModuleVisibilityEntry[]> {
  return requestApi<ModuleVisibilityEntry[]>(ADMIN_BASE, {
    method: 'PUT',
    body: JSON.stringify({ moduleKey, isEnabled }),
  });
}

/** Excepciones de visibilidad para el menú de cualquier usuario. */
export async function fetchModuleVisibilityMap(): Promise<Record<string, boolean>> {
  return requestApi<Record<string, boolean>>('/api/v1/modules/visibility');
}
