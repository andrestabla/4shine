import { requestApi } from '@/lib/api-client';
import type {
  CreatePlanInput,
  SubscriptionPlanWithFeatures,
  UpdatePlanInput,
} from './types';

export type { SubscriptionPlanWithFeatures, CreatePlanInput, UpdatePlanInput } from './types';

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

const BASE = '/api/v1/modules/administracion/planes';

export function listPlans(includeInactive = true) {
  const qs = includeInactive ? '?includeInactive=1' : '';
  return safe(() => requestApi<SubscriptionPlanWithFeatures[]>(`${BASE}${qs}`));
}

export function getPlan(planId: string) {
  return safe(() => requestApi<SubscriptionPlanWithFeatures>(`${BASE}/${planId}`));
}

export function createPlan(input: CreatePlanInput) {
  return safe(() =>
    requestApi<SubscriptionPlanWithFeatures>(`${BASE}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export function updatePlan(planId: string, input: UpdatePlanInput) {
  return safe(() =>
    requestApi<SubscriptionPlanWithFeatures>(`${BASE}/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}

export function setPlanActive(planId: string, isActive: boolean) {
  return updatePlan(planId, { isActive });
}

export function deletePlan(planId: string) {
  return safe(() =>
    requestApi<{ deleted: true }>(`${BASE}/${planId}`, { method: 'DELETE' }),
  );
}

export function listPublicPlans() {
  return safe(() => requestApi<SubscriptionPlanWithFeatures[]>(`/api/v1/modules/planes`));
}
