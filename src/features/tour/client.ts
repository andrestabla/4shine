import { requestApi } from '@/lib/api-client';
import type {
  CreateTourStepInput,
  FinishTourInput,
  MyTourPayload,
  RecordStepInput,
  TourAnalytics,
  TourSettingsRecord,
  TourStepRecord,
  UpdateTourStepInput,
  UpdateTourSettingsInput,
} from './types';

export type {
  CreateTourStepInput,
  FinishTourInput,
  MyTourPayload,
  RecordStepInput,
  TourAnalytics,
  TourSettingsRecord,
  TourStepRecord,
  UpdateTourStepInput,
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

const ADMIN = '/api/v1/modules/administracion/tour';
const ME = '/api/v1/me/tour';

// ─── Admin: steps ─────────────────────────────────────────────────────────────

export function listSteps() {
  return safe(() => requestApi<TourStepRecord[]>(ADMIN));
}

export function getStep(stepId: string) {
  return safe(() => requestApi<TourStepRecord>(`${ADMIN}/${stepId}`));
}

export function createStep(input: CreateTourStepInput) {
  return safe(() =>
    requestApi<TourStepRecord>(ADMIN, { method: 'POST', body: JSON.stringify(input) }),
  );
}

export function updateStep(stepId: string, input: UpdateTourStepInput) {
  return safe(() =>
    requestApi<TourStepRecord>(`${ADMIN}/${stepId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  );
}

export function deleteStep(stepId: string) {
  return safe(() => requestApi<{ deleted: true }>(`${ADMIN}/${stepId}`, { method: 'DELETE' }));
}

export function reorderSteps(orderedStepIds: string[]) {
  return safe(() =>
    requestApi<TourStepRecord[]>(`${ADMIN}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ orderedStepIds }),
    }),
  );
}

// ─── Admin: settings + reset + analytics ───────────────────────────────────────

export function getSettings() {
  return safe(() => requestApi<TourSettingsRecord>(`${ADMIN}/settings`));
}

export function updateSettings(input: UpdateTourSettingsInput) {
  return safe(() =>
    requestApi<TourSettingsRecord>(`${ADMIN}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}

export function resetTour() {
  return safe(() => requestApi<TourSettingsRecord>(`${ADMIN}/reset`, { method: 'POST' }));
}

export function getAnalytics() {
  return safe(() => requestApi<TourAnalytics>(`${ADMIN}/analytics`));
}

// ─── User-facing ────────────────────────────────────────────────────────────

export function getMyTour() {
  return safe(() => requestApi<MyTourPayload>(ME));
}

export function recordStepView(input: RecordStepInput) {
  return safe(() =>
    requestApi<{ ok: true }>(`${ME}/progress`, { method: 'POST', body: JSON.stringify(input) }),
  );
}

export function finishTour(input: FinishTourInput) {
  return safe(() =>
    requestApi<{ ok: true }>(`${ME}/progress`, { method: 'PATCH', body: JSON.stringify(input) }),
  );
}
