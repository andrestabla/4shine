import { requestApi } from '@/lib/api-client';
import type {
  CreateLearningCommentInput,
  LearningCommentRecord,
  LearningResourceRecord,
  UpdateWorkbookInput,
  WorkbookEditableFields,
  WorkbookRecord,
  WorkbookStatePayload,
} from './service';

export type {
  LearningCommentRecord,
  LearningResourceRecord,
  UpdateWorkbookInput,
  WorkbookEditableFields,
  WorkbookRecord,
  WorkbookStatePayload,
};

export async function listLearningResources(): Promise<LearningResourceRecord[]> {
  return requestApi<LearningResourceRecord[]>('/api/v1/modules/aprendizaje/resources');
}

export async function createLearningComment(input: CreateLearningCommentInput): Promise<LearningCommentRecord> {
  return requestApi<LearningCommentRecord>('/api/v1/modules/aprendizaje/comments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
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
