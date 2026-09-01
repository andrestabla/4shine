import { requestApi } from '@/lib/api-client';
import type {
  AssignableUser,
  ContentCohortAssignment,
  CohortDetail,
  CohortMemberRecord,
  CohortRecord,
  CohortReport,
  CohortStatus,
  CreateCohortInput,
  UpdateCohortInput,
} from './service';

export type {
  AssignableUser,
  ContentCohortAssignment,
  CohortDetail,
  CohortMemberRecord,
  CohortRecord,
  CohortReport,
  CohortStatus,
  CreateCohortInput,
  UpdateCohortInput,
};

const BASE = '/api/v1/modules/cohortes';

export async function listCohorts(): Promise<CohortRecord[]> {
  return requestApi<CohortRecord[]>(BASE);
}

export async function createCohort(input: CreateCohortInput): Promise<CohortRecord> {
  return requestApi<CohortRecord>(BASE, { method: 'POST', body: JSON.stringify(input) });
}

export async function getCohortDetail(cohortId: string): Promise<CohortDetail> {
  return requestApi<CohortDetail>(`${BASE}/${cohortId}`);
}

export async function updateCohort(
  cohortId: string,
  input: UpdateCohortInput,
): Promise<CohortRecord> {
  return requestApi<CohortRecord>(`${BASE}/${cohortId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteCohort(cohortId: string): Promise<{ cohortId: string }> {
  return requestApi<{ cohortId: string }>(`${BASE}/${cohortId}`, { method: 'DELETE' });
}

export async function listAssignableUsers(cohortId: string): Promise<AssignableUser[]> {
  return requestApi<AssignableUser[]>(`${BASE}/${cohortId}/asignables`);
}

export async function addCohortMembers(
  cohortId: string,
  userIds: string[],
): Promise<{ added: number }> {
  return requestApi<{ added: number }>(`${BASE}/${cohortId}/miembros`, {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
}

export async function removeCohortMembers(
  cohortId: string,
  userIds: string[],
): Promise<{ removed: number }> {
  return requestApi<{ removed: number }>(`${BASE}/${cohortId}/miembros`, {
    method: 'DELETE',
    body: JSON.stringify({ userIds }),
  });
}

export async function setCohortModuleAccess(
  cohortId: string,
  moduleCode: string,
  isEnabled: boolean | null,
): Promise<Record<string, boolean>> {
  return requestApi<Record<string, boolean>>(`${BASE}/${cohortId}/accesos`, {
    method: 'PUT',
    body: JSON.stringify({ moduleCode, isEnabled }),
  });
}

export async function getContentCohorts(contentId: string): Promise<ContentCohortAssignment[]> {
  return requestApi<ContentCohortAssignment[]>(`${BASE}/contenidos/${contentId}`);
}

export async function setContentCohorts(
  contentId: string,
  cohortIds: string[],
): Promise<ContentCohortAssignment[]> {
  return requestApi<ContentCohortAssignment[]>(`${BASE}/contenidos/${contentId}`, {
    method: 'PUT',
    body: JSON.stringify({ cohortIds }),
  });
}
