import { requestApi } from '@/lib/api-client';
import type { AdvisorCategory, AdvisorProfileRecord, UpdateAdvisorProfileInput } from './service';

export type { AdvisorCategory, AdvisorProfileRecord, UpdateAdvisorProfileInput };

export async function getAdvisorProfile(userId: string): Promise<AdvisorProfileRecord> {
  return requestApi<AdvisorProfileRecord>(`/api/v1/modules/advisors/${userId}`);
}

export async function updateAdvisorProfile(
  userId: string,
  input: UpdateAdvisorProfileInput,
): Promise<AdvisorProfileRecord> {
  return requestApi<AdvisorProfileRecord>(`/api/v1/modules/advisors/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function listAdvisorCategories(): Promise<AdvisorCategory[]> {
  return requestApi<AdvisorCategory[]>('/api/v1/modules/advisors/categorias');
}

export async function createAdvisorCategory(label: string): Promise<AdvisorCategory[]> {
  return requestApi<AdvisorCategory[]>('/api/v1/modules/advisors/categorias', {
    method: 'POST',
    body: JSON.stringify({ label }),
  });
}
