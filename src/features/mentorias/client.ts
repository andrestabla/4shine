import { requestApi } from '@/lib/api-client';
import type {
  AdditionalMentorshipOrderRecord,
  CreateAdditionalMentorshipOrderInput,
  CreateGroupSessionInput,
  CreateGroupSessionRecordingInput,
  CreateMentorshipInput,
  GroupSessionAnalyticsRecord,
  GroupSessionEventRecord,
  GroupSessionParticipationStatus,
  GroupSessionReaction,
  GroupSessionRecordingRecord,
  InviteGroupSessionByRolesInput,
  BulkMentorAvailabilityInput,
  UpsertMentorAvailabilityInput,
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
  UpdateGroupSessionInput,
  UpdateMentorshipInput,
} from './service';

export type {
  AdditionalMentorshipOrderRecord,
  CreateAdditionalMentorshipOrderInput,
  CreateGroupSessionInput,
  CreateGroupSessionRecordingInput,
  CreateMentorshipInput,
  GroupSessionAnalyticsRecord,
  GroupSessionEventRecord,
  GroupSessionParticipationStatus,
  GroupSessionReaction,
  GroupSessionRecordingRecord,
  InviteGroupSessionByRolesInput,
  BulkMentorAvailabilityInput,
  UpsertMentorAvailabilityInput,
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
  UpdateGroupSessionInput,
  UpdateMentorshipInput,
};

export interface SmartSearchResult {
  mentorIds: string[];
  rationale: string;
  llmAvailable?: boolean;
}

export async function smartSearchMentors(query: string): Promise<SmartSearchResult> {
  return requestApi<SmartSearchResult>('/api/v1/modules/mentorias/smart-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
    timeoutMs: 30000,
  });
}

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

export async function createGroupSession(input: CreateGroupSessionInput): Promise<GroupSessionEventRecord> {
  return requestApi<GroupSessionEventRecord>('/api/v1/modules/mentorias/group-sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateGroupSession(
  eventId: string,
  input: UpdateGroupSessionInput,
): Promise<GroupSessionEventRecord> {
  return requestApi<GroupSessionEventRecord>(`/api/v1/modules/mentorias/group-sessions/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteGroupSession(eventId: string): Promise<void> {
  await requestApi<void>(`/api/v1/modules/mentorias/group-sessions/${eventId}`, { method: 'DELETE' });
}

export async function participateInGroupSession(
  eventId: string,
  status: GroupSessionParticipationStatus,
): Promise<GroupSessionEventRecord> {
  return requestApi<GroupSessionEventRecord>(`/api/v1/modules/mentorias/group-sessions/${eventId}/participate`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export async function createGroupSessionRecording(
  input: CreateGroupSessionRecordingInput,
): Promise<GroupSessionRecordingRecord> {
  return requestApi<GroupSessionRecordingRecord>('/api/v1/modules/mentorias/group-sessions/recordings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function reactToGroupSessionRecording(
  recordingId: string,
  reaction: GroupSessionReaction,
): Promise<GroupSessionRecordingRecord> {
  return requestApi<GroupSessionRecordingRecord>(
    `/api/v1/modules/mentorias/group-sessions/recordings/${recordingId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ reaction }),
    },
  );
}

export async function commentGroupSessionRecording(
  recordingId: string,
  commentText: string,
): Promise<GroupSessionRecordingRecord> {
  return requestApi<GroupSessionRecordingRecord>(
    `/api/v1/modules/mentorias/group-sessions/recordings/${recordingId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ commentText }),
    },
  );
}

export async function inviteGroupSessionByRoles(
  eventId: string,
  roleCodes: InviteGroupSessionByRolesInput['roleCodes'],
): Promise<{ invitedCount: number }> {
  return requestApi<{ invitedCount: number }>(`/api/v1/modules/mentorias/group-sessions/${eventId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ roleCodes }),
  });
}

export async function getGroupSessionAnalytics(): Promise<GroupSessionAnalyticsRecord[]> {
  return requestApi<GroupSessionAnalyticsRecord[]>('/api/v1/modules/mentorias/group-sessions/analytics');
}

export async function dispatchGroupSessionReminders(windowType: '14h' | '30m'): Promise<{ notified: number }> {
  return requestApi<{ notified: number }>('/api/v1/modules/mentorias/group-sessions/reminders/dispatch', {
    method: 'POST',
    body: JSON.stringify({ windowType }),
  });
}

export async function upsertMentorAvailabilitySlot(
  input: UpsertMentorAvailabilityInput,
): Promise<{ ok: true }> {
  return requestApi<{ ok: true }>('/api/v1/modules/mentorias/availability', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function bulkCreateMentorAvailability(
  input: BulkMentorAvailabilityInput,
): Promise<{ created: number }> {
  return requestApi<{ created: number }>('/api/v1/modules/mentorias/availability/bulk', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteAvailabilitySlot(input: {
  mentorUserId: string;
  startsAt: string;
}): Promise<void> {
  await requestApi('/api/v1/modules/mentorias/availability', {
    method: 'DELETE',
    body: JSON.stringify(input),
  });
}

export interface MentorAvailabilityFullRecord {
  availabilityId: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
}

export async function listMentorAvailability(
  mentorUserId: string,
  options?: { from?: string; to?: string },
): Promise<MentorAvailabilityFullRecord[]> {
  const params = new URLSearchParams({ mentorUserId });
  if (options?.from) params.set('from', options.from);
  if (options?.to) params.set('to', options.to);
  return requestApi<MentorAvailabilityFullRecord[]>(
    `/api/v1/modules/mentorias/availability?${params.toString()}`,
  );
}

export async function bulkDeleteMentorAvailability(input: {
  mentorUserId: string;
  startsAtList: string[];
}): Promise<{ deleted: number; skippedBooked: number }> {
  return requestApi<{ deleted: number; skippedBooked: number }>(
    '/api/v1/modules/mentorias/availability/bulk-delete',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function dispatchProgramMentorshipReminders(): Promise<{ notified: number }> {
  return requestApi<{ notified: number }>('/api/v1/modules/mentorias/program-reminders/dispatch', {
    method: 'POST',
  });
}
