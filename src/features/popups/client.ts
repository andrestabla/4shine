import { requestApi } from '@/lib/api-client';
import type { CreatePopupInput, PopupRecord, PublicPopup, UpdatePopupInput } from './types';

export type {
  CreatePopupInput,
  PopupRecord,
  PublicPopup,
  UpdatePopupInput,
  PopupTrigger,
  PopupFrequency,
  PopupTargetMode,
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

const ADMIN = '/api/v1/modules/administracion/notificaciones/popups';

export function listPopups() {
  return safe(() => requestApi<PopupRecord[]>(ADMIN));
}

export function createPopup(input: CreatePopupInput) {
  return safe(() => requestApi<PopupRecord>(ADMIN, { method: 'POST', body: JSON.stringify(input) }));
}

export function updatePopup(popupId: string, input: UpdatePopupInput) {
  return safe(() =>
    requestApi<PopupRecord>(`${ADMIN}/${popupId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  );
}

export function deletePopup(popupId: string) {
  return safe(() => requestApi<{ deleted: true }>(`${ADMIN}/${popupId}`, { method: 'DELETE' }));
}

/** Público: popups activos para el runtime (sin autenticación). */
export async function getActivePopups(): Promise<PublicPopup[]> {
  try {
    const res = await fetch('/api/v1/public/popups', { cache: 'no-store' });
    if (!res.ok) return [];
    const payload = (await res.json()) as { ok?: boolean; data?: PublicPopup[] };
    return payload.ok && Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}
