import { requestApi } from '@/lib/api-client';

export type ContentScope = 'aprendizaje' | 'metodologia' | 'formacion_mentores' | 'formacion_lideres';
export type ContentType = 'video' | 'pdf' | 'scorm' | 'article' | 'podcast' | 'html' | 'ppt';
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';

export interface ContentItemRecord {
  contentId: string;
  scope: ContentScope;
  title: string;
  description: string | null;
  contentType: ContentType;
  category: string;
  durationMinutes: number | null;
  durationLabel: string | null;
  url: string | null;
  authorUserId: string | null;
  authorName: string | null;
  status: ContentStatus;
  isRecommended: boolean;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentInput {
  scope: ContentScope;
  title: string;
  description?: string | null;
  contentType: ContentType;
  category: string;
  durationMinutes?: number | null;
  durationLabel?: string | null;
  url?: string | null;
  status?: ContentStatus;
  isRecommended?: boolean;
}

export interface UpdateContentInput {
  title?: string;
  description?: string | null;
  contentType?: ContentType;
  category?: string;
  durationMinutes?: number | null;
  durationLabel?: string | null;
  url?: string | null;
  status?: ContentStatus;
  isRecommended?: boolean;
}

export async function listContent(scope?: ContentScope): Promise<ContentItemRecord[]> {
  const params = new URLSearchParams();
  if (scope) params.set('scope', scope);
  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return requestApi<ContentItemRecord[]>(`/api/v1/modules/contenido${suffix}`);
}

export async function createContent(input: CreateContentInput): Promise<ContentItemRecord> {
  return requestApi<ContentItemRecord>('/api/v1/modules/contenido', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateContent(contentId: string, input: UpdateContentInput): Promise<ContentItemRecord> {
  return requestApi<ContentItemRecord>(`/api/v1/modules/contenido/${contentId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteContent(contentId: string): Promise<{ contentId: string }> {
  return requestApi<{ contentId: string }>(`/api/v1/modules/contenido/${contentId}`, {
    method: 'DELETE',
  });
}
