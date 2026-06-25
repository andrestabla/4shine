import { requestApi } from '@/lib/api-client';
import type { UserPurchaseRecord } from '@/features/access/types';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
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

export type AdvisorPillarCode = 'shine_within' | 'shine_out' | 'shine_up' | 'shine_beyond';

export interface AdvisorTopicRecord {
  topicId: string;
  topicLabel: string;
  pillarCode: AdvisorPillarCode;
}

export interface AdvisorProfileRecord {
  experiencia: string | null;
  precioSesion: number | null;
  currencyCode: string;
  temas: AdvisorTopicRecord[];
}

export interface AdvisorTopicInput {
  topicLabel: string;
  pillarCode: AdvisorPillarCode;
}

export interface AdvisorProfileInput {
  experiencia?: string | null;
  precioSesion?: number | null;
  temas?: AdvisorTopicInput[];
}

export const ADVISER_PRECIO_MIN = 180000;
export const ADVISER_PRECIO_MAX = 500000;

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
  subscriptionPlanId: string | null;
  subscriptionPlanCode: string | null;
  subscriptionPlanName: string | null;
  subscriptionPlanGroup: string | null;
  subscriptionPlanHighlightLabel: string | null;
  subscriptionPlanPriceAmount: number | null;
  subscriptionPlanCurrencyCode: string | null;
  subscriptionExpiresAt: string | null;
  seniorityLevel: string | null;
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
  purchases: UserPurchaseRecord[];
  advisorProfile: AdvisorProfileRecord | null;
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
  advisorProfile?: AdvisorProfileInput;
}

export interface ExtractProfileFromCvResult {
  firstName: string;
  lastName: string;
  profession: string;
  industry: string;
  location: string;
  bio: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  interests: string[];
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
  timezone: string;
  projects: { title: string; description: string; projectRole: string }[];
  advisorExperiencia: string;
  advisorTemas: { topicLabel: string; pillarCode: 'shine_within' | 'shine_out' | 'shine_up' | 'shine_beyond' }[];
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
