import { requestApi } from '@/lib/api-client';
import type { GhlDashboardData, GhlProgramMapRecord, UpdateGhlProgramInput } from './types';

export type {
  GhlDashboardData,
  GhlDashboardStats,
  GhlEventStatus,
  GhlProgramMapRecord,
  GhlWebhookEventRecord,
  UpdateGhlProgramInput,
} from './types';

const BASE = '/api/v1/modules/administracion/ghl';

export async function getGhlDashboard(params?: {
  status?: string | null;
  search?: string | null;
  limit?: number;
}): Promise<GhlDashboardData> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return requestApi<GhlDashboardData>(`${BASE}${suffix}`);
}

export async function updateGhlProgram(input: UpdateGhlProgramInput): Promise<GhlProgramMapRecord> {
  return requestApi<GhlProgramMapRecord>(BASE, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function retryGhlEvent(eventId: string): Promise<{ status: string; message: string }> {
  return requestApi<{ status: string; message: string }>(BASE, {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });
}
