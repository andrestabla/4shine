import { requestApi } from '@/lib/api-client';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type SeniorityLevel = 'senior' | 'c_level' | 'director' | 'manager' | 'vp';
type JobRole =
  | 'Director/C-Level'
  | 'Gerente/Mando medio'
  | 'Coordinador'
  | 'Lider de proyecto con equipo a cargo'
  | 'Especialista sin personal a cargo';

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
  country: string | null;
  jobRole: JobRole | null;
  gender: string | null;
  yearsExperience: number | null;
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
  country?: string | null;
  jobRole?: JobRole | null;
  gender?: string | null;
  yearsExperience?: number | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  interests?: string[];
  projects?: ProfileProjectInput[];
}

export interface ExtractProfileFromCvResult {
  firstName: string;
  lastName: string;
  country: string;
  jobRole:
    | 'Director/C-Level'
    | 'Gerente/Mando medio'
    | 'Coordinador'
    | 'Lider de proyecto con equipo a cargo'
    | 'Especialista sin personal a cargo'
    | '';
  gender: 'Hombre' | 'Mujer' | 'Prefiero no decirlo' | '';
  yearsExperience: number | null;
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

export async function extractProfileFromCv(fileUrl: string): Promise<ExtractProfileFromCvResult> {
  return requestApi<ExtractProfileFromCvResult>('/api/v1/modules/perfil/cv-extract', {
    method: 'POST',
    body: JSON.stringify({ fileUrl }),
    timeoutMs: 90000,
  });
}
