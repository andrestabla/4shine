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

export async function getAnalytics(from: string, to: string): Promise<AnalyticsResult> {
  const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  return requestApi<AnalyticsResult>(`/api/v1/modules/analitica?${qs}`, { timeoutMs: 30000 });
}
