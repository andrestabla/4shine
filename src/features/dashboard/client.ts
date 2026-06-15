import { requestApi } from '@/lib/api-client';
import type { DashboardSummary } from './types';

export type { DashboardSummary } from './types';

export async function getMyDashboard(): Promise<DashboardSummary | null> {
  try {
    return await requestApi<DashboardSummary>('/api/v1/me/dashboard');
  } catch {
    return null;
  }
}
