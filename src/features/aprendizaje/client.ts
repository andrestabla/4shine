import { requestApi } from '@/lib/api-client';
import type {
  LearningMetadataAssistantInput,
  LearningMetadataAssistantResult,
} from './metadata-assistant';
import type {
  CreateLearningCommentInput,
  LearningLikeToggleResult,
  LearningCommentRecord,
  LearningResourceListQuery,
  LearningResourceListResult,
  LearningResourceRecord,
  UpdateWorkbookInput,
  WorkbookEditableFields,
  WorkbookRecord,
  WorkbookStatePayload,
} from './service';

export type {
  LearningCommentRecord,
  LearningLikeToggleResult,
  LearningMetadataAssistantInput,
  LearningMetadataAssistantResult,
  LearningResourceListQuery,
  LearningResourceListResult,
  LearningResourceRecord,
  UpdateWorkbookInput,
  WorkbookEditableFields,
  WorkbookRecord,
  WorkbookStatePayload,
};

export async function listLearningResources(
  query: LearningResourceListQuery = {},
): Promise<LearningResourceListResult> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.contentType) params.set('contentType', query.contentType);
  if (query.status) params.set('status', query.status);
  if (query.pillar) params.set('pillar', query.pillar);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return requestApi<LearningResourceListResult>(`/api/v1/modules/aprendizaje/resources${suffix}`);
}

export async function getLearningResourceDetail(contentId: string): Promise<LearningResourceRecord> {
  return requestApi<LearningResourceRecord>(`/api/v1/modules/aprendizaje/resources/${contentId}`);
}

export async function createLearningComment(input: CreateLearningCommentInput): Promise<LearningCommentRecord> {
  return requestApi<LearningCommentRecord>('/api/v1/modules/aprendizaje/comments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function toggleLearningLike(contentId: string): Promise<LearningLikeToggleResult> {
  return requestApi<LearningLikeToggleResult>(`/api/v1/modules/aprendizaje/resources/${contentId}/like`, {
    method: 'POST',
  });
}

export async function extractLearningMetadataWithAi(
  input: LearningMetadataAssistantInput,
): Promise<LearningMetadataAssistantResult> {
  return requestApi<LearningMetadataAssistantResult>(
    '/api/v1/modules/aprendizaje/metadata-assistant',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function listLearningWorkbooks(ownerUserId?: string): Promise<WorkbookRecord[]> {
  const params = new URLSearchParams();
  if (ownerUserId) {
    params.set('ownerUserId', ownerUserId);
  }

  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return requestApi<WorkbookRecord[]>(`/api/v1/modules/aprendizaje/workbooks${suffix}`);
}

export async function updateLearningWorkbook(
  workbookId: string,
  input: UpdateWorkbookInput,
): Promise<WorkbookRecord> {
  return requestApi<WorkbookRecord>(`/api/v1/modules/aprendizaje/workbooks/${workbookId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function getLearningWorkbook(workbookId: string): Promise<WorkbookRecord> {
  return requestApi<WorkbookRecord>(`/api/v1/modules/aprendizaje/workbooks/${workbookId}`);
}

export async function deleteLearningWorkbook(workbookId: string): Promise<{ workbookId: string }> {
  return requestApi<{ workbookId: string }>(`/api/v1/modules/aprendizaje/workbooks/${workbookId}`, {
    method: 'DELETE',
  });
}
