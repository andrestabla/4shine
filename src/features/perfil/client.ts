import { requestApi } from '@/lib/api-client';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type SeniorityLevel = 'senior' | 'c_level' | 'director' | 'manager' | 'vp';

export interface ProfileProjectRecord {
  projectId: string;
  title: string;
  description: string | null;
  projectRole: string | null;
  imageUrl: string | null;
}

export interface MyProfileRecord {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarInitial: string | null;
  avatarUrl: string | null;
  timezone: string;
  organizationId: string | null;
  organizationName: string | null;
  profession: string | null;
  industry: string | null;
  planType: PlanType | null;
  seniorityLevel: SeniorityLevel | null;
  bio: string | null;
  location: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  interests: string[];
  projects: ProfileProjectRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileProjectInput {
  title: string;
  description?: string | null;
  projectRole?: string | null;
  imageUrl?: string | null;
}

export interface UpdateMyProfileInput {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  timezone?: string;
  profession?: string | null;
  industry?: string | null;
  planType?: PlanType | null;
  seniorityLevel?: SeniorityLevel | null;
  bio?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  interests?: string[];
  projects?: ProfileProjectInput[];
}

export async function getMyProfile(): Promise<MyProfileRecord> {
  return requestApi<MyProfileRecord>('/api/v1/modules/perfil');
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<MyProfileRecord> {
  return requestApi<MyProfileRecord>('/api/v1/modules/perfil', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
