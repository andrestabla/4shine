import { requestApi } from '@/lib/api-client';
import type {
  RolePermissionCell,
  RolePermissionsMatrix,
  UpdateRolePermissionInput,
} from './types';

export type {
  RolePermissionsMatrix,
  RolePermissionCell,
  UpdateRolePermissionInput,
} from './types';

interface SafeResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function safe<T>(fn: () => Promise<T>): Promise<SafeResponse<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error inesperado' };
  }
}

const BASE = '/api/v1/modules/administracion/roles';

export function getRolePermissionsMatrix() {
  return safe(() => requestApi<RolePermissionsMatrix>(`${BASE}`));
}

export function updateRolePermission(input: UpdateRolePermissionInput) {
  return safe(() =>
    requestApi<RolePermissionCell>(`${BASE}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}
