import { requestApi } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConvocatoriaStatus = 'draft' | 'open' | 'closed' | 'suspended';

export interface ConvocatoriaDate {
  dateId: string;
  label: string;
  dateValue: string;
  sortOrder: number;
}

export interface ConvocatoriaFaq {
  faqId: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface ConvocatoriaImage {
  imageId: string;
  url: string;
  sortOrder: number;
}

export interface ConvocatoriaAttachment {
  attachmentId: string;
  fileUrl: string;
  fileName: string;
}

export interface ConvocatoriaSummary {
  convocatoriaId: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  externalUrl: string | null;
  location: string | null;
  status: ConvocatoriaStatus;
  applicationsCount: number;
  hasApplied: boolean;
  nextDate: string | null;
  nextDateLabel: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConvocatoriaDetail extends ConvocatoriaSummary {
  images: ConvocatoriaImage[];
  attachments: ConvocatoriaAttachment[];
  dates: ConvocatoriaDate[];
  faqs: ConvocatoriaFaq[];
}

export interface ConvocatoriaForumPost {
  postId: string;
  convocatoriaId: string;
  authorUserId: string;
  authorName: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
}

export interface CreateConvocatoriaInput {
  title: string;
  description?: string;
  coverImageUrl?: string | null;
  externalUrl?: string | null;
  location?: string | null;
  status?: ConvocatoriaStatus;
}

export interface UpdateConvocatoriaInput {
  title?: string;
  description?: string;
  coverImageUrl?: string | null;
  externalUrl?: string | null;
  location?: string | null;
  status?: ConvocatoriaStatus;
}

export interface SetDatesInput {
  label: string;
  dateValue: string;
  sortOrder?: number;
}

export interface SetFaqsInput {
  question: string;
  answer: string;
  sortOrder?: number;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

const BASE = '/api/v1/modules/convocatorias';

export function listConvocatorias(): Promise<ConvocatoriaSummary[]> {
  return requestApi<ConvocatoriaSummary[]>(BASE);
}

export function getConvocatoria(id: string): Promise<ConvocatoriaDetail> {
  return requestApi<ConvocatoriaDetail>(`${BASE}/${id}`);
}

export function createConvocatoria(input: CreateConvocatoriaInput): Promise<ConvocatoriaSummary> {
  return requestApi<ConvocatoriaSummary>(BASE, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateConvocatoria(id: string, input: UpdateConvocatoriaInput): Promise<ConvocatoriaSummary> {
  return requestApi<ConvocatoriaSummary>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteConvocatoria(id: string): Promise<{ convocatoriaId: string }> {
  return requestApi<{ convocatoriaId: string }>(`${BASE}/${id}`, { method: 'DELETE' });
}

// ── Images ────────────────────────────────────────────────────────────────────

export function addImage(id: string, url: string): Promise<ConvocatoriaImage> {
  return requestApi<ConvocatoriaImage>(`${BASE}/${id}/images`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export function removeImage(id: string, imageId: string): Promise<{ imageId: string }> {
  return requestApi<{ imageId: string }>(`${BASE}/${id}/images/${imageId}`, { method: 'DELETE' });
}

// ── Attachments ───────────────────────────────────────────────────────────────

export function addAttachment(id: string, fileUrl: string, fileName: string): Promise<ConvocatoriaAttachment> {
  return requestApi<ConvocatoriaAttachment>(`${BASE}/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify({ fileUrl, fileName }),
  });
}

export function removeAttachment(id: string, attachmentId: string): Promise<{ attachmentId: string }> {
  return requestApi<{ attachmentId: string }>(`${BASE}/${id}/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}

// ── Dates ─────────────────────────────────────────────────────────────────────

export function setDates(id: string, dates: SetDatesInput[]): Promise<ConvocatoriaDate[]> {
  return requestApi<ConvocatoriaDate[]>(`${BASE}/${id}/dates`, {
    method: 'PUT',
    body: JSON.stringify({ dates }),
  });
}

// ── FAQs ──────────────────────────────────────────────────────────────────────

export function setFaqs(id: string, faqs: SetFaqsInput[]): Promise<ConvocatoriaFaq[]> {
  return requestApi<ConvocatoriaFaq[]>(`${BASE}/${id}/faqs`, {
    method: 'PUT',
    body: JSON.stringify({ faqs }),
  });
}

// ── Applications ──────────────────────────────────────────────────────────────

export function applyToConvocatoria(id: string): Promise<{ applicationId: string }> {
  return requestApi<{ applicationId: string }>(`${BASE}/${id}/apply`, { method: 'POST' });
}

export function withdrawApplication(id: string): Promise<{ convocatoriaId: string }> {
  return requestApi<{ convocatoriaId: string }>(`${BASE}/${id}/apply`, { method: 'DELETE' });
}

// ── Forum ─────────────────────────────────────────────────────────────────────

export function listForumPosts(id: string): Promise<ConvocatoriaForumPost[]> {
  return requestApi<ConvocatoriaForumPost[]>(`${BASE}/${id}/forum`);
}

export function createForumPost(id: string, body: string, isPinned?: boolean): Promise<ConvocatoriaForumPost> {
  return requestApi<ConvocatoriaForumPost>(`${BASE}/${id}/forum`, {
    method: 'POST',
    body: JSON.stringify({ body, isPinned }),
  });
}

export function deleteForumPost(id: string, postId: string): Promise<{ postId: string }> {
  return requestApi<{ postId: string }>(`${BASE}/${id}/forum/${postId}`, { method: 'DELETE' });
}

// ── Requests (líder solicita publicación) ─────────────────────────────────────

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ConvocatoriaRequest {
  requestId: string;
  title: string;
  description: string;
  requesterUserId: string;
  requesterName: string;
  status: RequestStatus;
  reviewerUserId: string | null;
  reviewerName: string | null;
  reviewerNotes: string | null;
  convocatoriaId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestInput {
  title: string;
  description?: string;
}

export interface ReviewRequestInput {
  status: 'approved' | 'rejected';
  reviewerNotes?: string;
}

export function listRequests(filter?: 'all' | 'pending' | 'mine'): Promise<ConvocatoriaRequest[]> {
  const q = filter ? `?filter=${filter}` : '';
  return requestApi<ConvocatoriaRequest[]>(`${BASE}/requests${q}`);
}

export function createRequest(input: CreateRequestInput): Promise<ConvocatoriaRequest> {
  return requestApi<ConvocatoriaRequest>(`${BASE}/requests`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function reviewRequest(requestId: string, input: ReviewRequestInput): Promise<ConvocatoriaRequest> {
  return requestApi<ConvocatoriaRequest>(`${BASE}/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
