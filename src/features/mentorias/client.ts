import { requestApi } from '@/lib/api-client';

export type MentorshipSessionType = 'individual' | 'grupal';
export type MentorshipStatus = 'scheduled' | 'completed' | 'cancelled' | 'pending_rating' | 'pending_approval' | 'no_show';

export interface MentorshipRecord {
  sessionId: string;
  title: string;
  description: string | null;
  mentorUserId: string;
  mentorName: string;
  menteeUserId: string | null;
  menteeName: string | null;
  startsAt: string;
  endsAt: string;
  sessionType: MentorshipSessionType;
  status: MentorshipStatus;
  meetingUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorshipInput {
  title: string;
  description?: string | null;
  mentorUserId?: string;
  menteeUserIds?: string[];
  startsAt: string;
  endsAt: string;
  sessionType: MentorshipSessionType;
  status?: MentorshipStatus;
  meetingUrl?: string | null;
}

export interface UpdateMentorshipInput {
  title?: string;
  description?: string | null;
  startsAt?: string;
  endsAt?: string;
  sessionType?: MentorshipSessionType;
  status?: MentorshipStatus;
  meetingUrl?: string | null;
}

export async function listMentorships(): Promise<MentorshipRecord[]> {
  return requestApi<MentorshipRecord[]>('/api/v1/modules/mentorias');
}

export async function createMentorship(input: CreateMentorshipInput): Promise<MentorshipRecord> {
  return requestApi<MentorshipRecord>('/api/v1/modules/mentorias', {
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
