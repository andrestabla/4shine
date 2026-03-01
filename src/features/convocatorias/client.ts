import { requestApi } from '@/lib/api-client';

export type WorkMode = 'presencial' | 'hibrido' | 'remoto' | 'voluntariado';

export interface JobPostRecord {
  jobPostId: string;
  title: string;
  companyName: string;
  organizationId: string | null;
  location: string | null;
  workMode: WorkMode | null;
  description: string;
  postedBy: string | null;
  postedAt: string;
  expiresAt: string | null;
  isActive: boolean;
  applicants: number;
}

export interface CreateJobPostInput {
  title: string;
  companyName: string;
  organizationId?: string | null;
  location?: string | null;
  workMode?: WorkMode | null;
  description: string;
  expiresAt?: string | null;
  isActive?: boolean;
}

export interface UpdateJobPostInput {
  title?: string;
  companyName?: string;
  organizationId?: string | null;
  location?: string | null;
  workMode?: WorkMode | null;
  description?: string;
  expiresAt?: string | null;
  isActive?: boolean;
}

export async function listJobPosts(): Promise<JobPostRecord[]> {
  return requestApi<JobPostRecord[]>('/api/v1/modules/convocatorias');
}

export async function createJobPost(input: CreateJobPostInput): Promise<JobPostRecord> {
  return requestApi<JobPostRecord>('/api/v1/modules/convocatorias', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateJobPost(jobPostId: string, input: UpdateJobPostInput): Promise<JobPostRecord> {
  return requestApi<JobPostRecord>(`/api/v1/modules/convocatorias/${jobPostId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteJobPost(jobPostId: string): Promise<{ jobPostId: string }> {
  return requestApi<{ jobPostId: string }>(`/api/v1/modules/convocatorias/${jobPostId}`, {
    method: 'DELETE',
  });
}
