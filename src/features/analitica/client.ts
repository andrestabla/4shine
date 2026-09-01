import { requestApi } from '@/lib/api-client';
import type { AnalyticsResult } from './types';

export type {
  AnalyticsResult,
  NameCount,
  SeriesPoint,
  UsuariosAnalytics,
  MentoriasAnalytics,
  DescubrimientoAnalytics,
  AprendizajeAnalytics,
  NetworkingAnalytics,
  ConvocatoriasAnalytics,
  WorkshopsAnalytics,
} from './types';

export async function getAnalytics(
  from: string,
  to: string,
  cohortId?: string | null,
): Promise<AnalyticsResult> {
  const qs =
    `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` +
    (cohortId ? `&cohortId=${encodeURIComponent(cohortId)}` : '');
  return requestApi<AnalyticsResult>(`/api/v1/modules/analitica?${qs}`, { timeoutMs: 30000 });
}
