import { requestApi } from '@/lib/api-client';
import type {
  DismissedIncident,
  IncidentRecord,
  IncidentResolution,
  IncidentsSummary,
} from './service';

export type { DismissedIncident, IncidentRecord, IncidentResolution, IncidentsSummary };

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

/** Cierra el caso (resuelto o descartado): deja de aparecer en el panel. */
export async function closeIncident(input: {
  incidentId: string;
  type: string;
  title: string;
  resolution: IncidentResolution;
  note?: string | null;
  userIds?: string[];
}): Promise<DismissedIncident> {
  return requestApi<DismissedIncident>('/api/v1/modules/incidencias/cierres', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listClosedIncidents(userId?: string): Promise<DismissedIncident[]> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return requestApi<DismissedIncident[]>(`/api/v1/modules/incidencias/cierres${query}`);
}

/** Reabre un caso cerrado: vuelve al panel si el detector sigue encontrándolo. */
export async function reopenIncident(incidentId: string): Promise<{ reopened: boolean }> {
  return requestApi<{ reopened: boolean }>(
    `/api/v1/modules/incidencias/cierres?incidentId=${encodeURIComponent(incidentId)}`,
    { method: 'DELETE' },
  );
}
