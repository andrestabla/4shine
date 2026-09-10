import { requestApi } from '@/lib/api-client';

export type ContentScope = 'aprendizaje' | 'metodologia' | 'formacion_mentores' | 'formacion_lideres';
export type ContentType = 'video' | 'pdf' | 'scorm' | 'article' | 'podcast' | 'html' | 'ppt' | 'activity' | 'assignment';
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
export type ContentCompetencyMetadata = Record<string, string | null>;
export type CourseModuleResourceType = Exclude<ContentType, 'scorm'> | 'link' | 'zoom';

export interface CourseModuleResource {
  id: string;
  title: string;
  description?: string | null;
  contentType: CourseModuleResourceType;
  url?: string | null;
  durationLabel?: string | null;
  linkedContentId?: string | null;
  /** 'embed' incrusta el enlace en el curso; 'newTab' lo abre aparte. */
  openMode?: 'newTab' | 'embed' | null;
  /** Código de acceso de la grabación de Zoom (solo contentType = 'zoom'). */
  accessCode?: string | null;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string | null;
  resources: CourseModuleResource[];
}

export interface ContentStructurePayload {
  kind: 'resource' | 'course';
  modules?: CourseModule[];
}

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
  showInLibrary: boolean;
  deletedAt: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  competencyMetadata: ContentCompetencyMetadata;
  structurePayload: ContentStructurePayload;
  tags: string[];
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
  showInLibrary?: boolean;
  competencyMetadata?: ContentCompetencyMetadata;
  structurePayload?: ContentStructurePayload;
  tags?: string[];
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
  showInLibrary?: boolean;
  competencyMetadata?: ContentCompetencyMetadata;
  structurePayload?: ContentStructurePayload;
  tags?: string[];
  certificateTemplateId?: string | null;
}

export async function listContent(scope?: ContentScope, opts?: { trashed?: boolean }): Promise<ContentItemRecord[]> {
  const params = new URLSearchParams();
  if (scope) params.set('scope', scope);
  if (opts?.trashed) params.set('trashed', '1');
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

export type ZoomRecordingLookupResult =
  | { status: 'resolved'; url: string; topic: string | null }
  | { status: 'already_one_click'; url: string }
  | { status: 'not_zoom' }
  | { status: 'not_configured' }
  | { status: 'not_found' }
  | { status: 'error'; message: string };

/**
 * Pide al servidor el enlace de "un clic" de una grabación de Zoom (con el
 * código de acceso incrustado), usando la integración de Zoom de la cuenta.
 */
export async function resolveZoomRecordingLink(url: string): Promise<ZoomRecordingLookupResult> {
  return requestApi<ZoomRecordingLookupResult>('/api/v1/integrations/zoom/resolve-recording', {
    method: 'POST',
    body: JSON.stringify({ url }),
    timeoutMs: 60000,
  });
}

export async function deleteContent(contentId: string): Promise<{ contentId: string }> {
  return requestApi<{ contentId: string }>(`/api/v1/modules/contenido/${contentId}`, {
    method: 'DELETE',
  });
}

export async function restoreContent(contentId: string): Promise<{ contentId: string }> {
  return requestApi<{ contentId: string }>(`/api/v1/modules/contenido/${contentId}`, {
    method: 'POST',
  });
}

export async function purgeContent(contentId: string): Promise<{ contentId: string }> {
  return requestApi<{ contentId: string }>(`/api/v1/modules/contenido/${contentId}?permanent=1`, {
    method: 'DELETE',
  });
}
