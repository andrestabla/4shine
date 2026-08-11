import { requestApi } from '@/lib/api-client';
import type { IncidentRecord, IncidentsSummary } from './service';

export type { IncidentRecord, IncidentsSummary };

export async function listIncidents(userId?: string): Promise<IncidentsSummary> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestApi<IncidentsSummary>(`/api/v1/modules/incidencias${query}`);
}

export async function analyzeIncident(
  incident: Pick<IncidentRecord, 'type' | 'title' | 'summary' | 'evidence' | 'checklist'>,
): Promise<{ analysis: string | null }> {
  return requestApi<{ analysis: string | null }>('/api/v1/modules/incidencias/analizar', {
    method: 'POST',
    body: JSON.stringify(incident),
  });
}
