import { requestApi } from '@/lib/api-client';
import type {
  AdditionalMentorshipOrderRecord,
  CreateAdditionalMentorshipOrderInput,
  CreateMentorshipInput,
  MentorAvailabilitySlot,
  MentorCatalogRecord,
  MentorOfferingRecord,
  MentorshipOverviewRecord,
  MentorshipRecord,
  MentorshipSessionOrigin,
  MentorshipSessionType,
  MentorshipStatus,
  ProgramMentorshipEntitlementRecord,
  ProgramMentorshipStatus,
  ScheduleProgramMentorshipInput,
  UpdateMentorshipInput,
} from './service';

export type {
  AdditionalMentorshipOrderRecord,
  CreateAdditionalMentorshipOrderInput,
  CreateMentorshipInput,
  MentorAvailabilitySlot,
  MentorCatalogRecord,
  MentorOfferingRecord,
  MentorshipOverviewRecord,
  MentorshipRecord,
  MentorshipSessionOrigin,
  MentorshipSessionType,
  MentorshipStatus,
  ProgramMentorshipEntitlementRecord,
  ProgramMentorshipStatus,
  ScheduleProgramMentorshipInput,
  UpdateMentorshipInput,
};

export async function listMentorships(): Promise<MentorshipRecord[]> {
  return requestApi<MentorshipRecord[]>('/api/v1/modules/mentorias');
}

export async function getMentorshipOverview(): Promise<MentorshipOverviewRecord> {
  return requestApi<MentorshipOverviewRecord>('/api/v1/modules/mentorias/overview');
}

export async function createMentorship(input: CreateMentorshipInput): Promise<MentorshipRecord> {
  return requestApi<MentorshipRecord>('/api/v1/modules/mentorias', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function scheduleProgramMentorship(
  input: ScheduleProgramMentorshipInput,
): Promise<MentorshipRecord> {
  return requestApi<MentorshipRecord>('/api/v1/modules/mentorias/program-bookings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function createAdditionalMentorshipOrder(
  input: CreateAdditionalMentorshipOrderInput,
): Promise<AdditionalMentorshipOrderRecord> {
  return requestApi<AdditionalMentorshipOrderRecord>('/api/v1/modules/mentorias/additional-orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMentorship(sessionId: string, input: UpdateMentorshipInput): Promise<MentorshipRecord> {
  return requestApi<MentorshipRecord>(`/api/v1/modules/mentorias/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteMentorship(sessionId: string): Promise<{ sessionId: string }> {
  return requestApi<{ sessionId: string }>(`/api/v1/modules/mentorias/${sessionId}`, {
    method: 'DELETE',
  });
}
