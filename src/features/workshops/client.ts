import { requestApi } from '@/lib/api-client';

export type WorkshopType = 'relacionamiento' | 'formacion' | 'innovacion' | 'wellbeing' | 'otro';
export type WorkshopStatus = 'upcoming' | 'completed' | 'cancelled';
export type AttendanceStatus = 'invited' | 'registered' | 'attended' | 'no_show' | 'cancelled';

export interface WorkshopRecord {
  workshopId: string;
  title: string;
  description: string | null;
  workshopType: WorkshopType;
  status: WorkshopStatus;
  startsAt: string;
  endsAt: string;
  facilitatorUserId: string | null;
  facilitatorName: string | null;
  meetingUrl: string | null;
  attendees: number;
  myAttendanceStatus: AttendanceStatus | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopFaqRecord {
  faqId: string;
  workshopId: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface WorkshopForumPostRecord {
  postId: string;
  workshopId: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
}

export interface CreateWorkshopInput {
  title: string;
  description?: string | null;
  workshopType: WorkshopType;
  status?: WorkshopStatus;
  startsAt: string;
  endsAt: string;
  facilitatorUserId?: string | null;
  facilitatorName?: string | null;
  meetingUrl?: string | null;
}

export interface UpdateWorkshopInput {
  title?: string;
  description?: string | null;
  workshopType?: WorkshopType;
  status?: WorkshopStatus;
  startsAt?: string;
  endsAt?: string;
  facilitatorUserId?: string | null;
  facilitatorName?: string | null;
  meetingUrl?: string | null;
}

export interface CreateFaqInput {
  question: string;
  answer: string;
  sortOrder?: number;
}

const BASE = '/api/v1/modules/workshops';

export function listWorkshops(): Promise<WorkshopRecord[]> {
  return requestApi<WorkshopRecord[]>(BASE);
}

export function getWorkshop(workshopId: string): Promise<WorkshopRecord> {
  return requestApi<WorkshopRecord>(`${BASE}/${workshopId}`);
}

export function createWorkshop(input: CreateWorkshopInput): Promise<WorkshopRecord> {
  return requestApi<WorkshopRecord>(BASE, { method: 'POST', body: JSON.stringify(input) });
}

export function updateWorkshop(workshopId: string, input: UpdateWorkshopInput): Promise<WorkshopRecord> {
  return requestApi<WorkshopRecord>(`${BASE}/${workshopId}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteWorkshop(workshopId: string): Promise<{ workshopId: string }> {
  return requestApi<{ workshopId: string }>(`${BASE}/${workshopId}`, { method: 'DELETE' });
}

export function applyToWorkshop(workshopId: string): Promise<WorkshopRecord> {
  return requestApi<WorkshopRecord>(`${BASE}/${workshopId}/apply`, { method: 'POST' });
}

export function cancelApplication(workshopId: string): Promise<WorkshopRecord> {
  return requestApi<WorkshopRecord>(`${BASE}/${workshopId}/apply`, { method: 'DELETE' });
}

export function listFaqs(workshopId: string): Promise<WorkshopFaqRecord[]> {
  return requestApi<WorkshopFaqRecord[]>(`${BASE}/${workshopId}/faqs`);
}

export function createFaq(workshopId: string, input: CreateFaqInput): Promise<WorkshopFaqRecord> {
  return requestApi<WorkshopFaqRecord>(`${BASE}/${workshopId}/faqs`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteFaq(workshopId: string, faqId: string): Promise<{ faqId: string }> {
  return requestApi<{ faqId: string }>(`${BASE}/${workshopId}/faqs/${faqId}`, { method: 'DELETE' });
}

export function listForumPosts(workshopId: string): Promise<WorkshopForumPostRecord[]> {
  return requestApi<WorkshopForumPostRecord[]>(`${BASE}/${workshopId}/forum`);
}

export function createForumPost(workshopId: string, body: string): Promise<WorkshopForumPostRecord> {
  return requestApi<WorkshopForumPostRecord>(`${BASE}/${workshopId}/forum`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function deleteForumPost(workshopId: string, postId: string): Promise<{ postId: string }> {
  return requestApi<{ postId: string }>(`${BASE}/${workshopId}/forum/${postId}`, { method: 'DELETE' });
}

export function sendInquiry(workshopId: string, message: string): Promise<{ threadId: string }> {
  return requestApi<{ threadId: string }>(`${BASE}/${workshopId}/inquiry`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
