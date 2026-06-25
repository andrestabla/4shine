import { requestApi } from '@/lib/api-client';
import type {
  AssignmentForLearner,
  ContentAssignmentRecord,
  GradeSubmissionInput,
  SubmissionRecord,
  SubmissionUserRecord,
  UpsertAssignmentInput,
  UpsertSubmissionInput,
} from './types';

export type * from './types';

// ─── Admin/Gestor/Advisor ────────────────────────────────────────────────────

export async function getAssignmentForContentAdmin(
  contentId: string,
): Promise<ContentAssignmentRecord | null> {
  return requestApi<ContentAssignmentRecord | null>(
    `/api/v1/modules/aprendizaje/assignments/${contentId}`,
  );
}

export async function upsertAssignment(
  input: UpsertAssignmentInput,
): Promise<ContentAssignmentRecord> {
  return requestApi<ContentAssignmentRecord>(
    `/api/v1/modules/aprendizaje/assignments/${input.contentId}`,
    { method: 'PUT', body: JSON.stringify(input) },
  );
}

export async function deleteAssignment(contentId: string): Promise<void> {
  await requestApi(`/api/v1/modules/aprendizaje/assignments/${contentId}`, { method: 'DELETE' });
}

export async function listSubmissionsForAssignment(
  assignmentId: string,
): Promise<SubmissionUserRecord[]> {
  return requestApi<SubmissionUserRecord[]>(
    `/api/v1/modules/aprendizaje/assignments/${assignmentId}/submissions`,
  );
}

export async function gradeSubmission(
  submissionId: string,
  input: GradeSubmissionInput,
): Promise<SubmissionRecord> {
  return requestApi<SubmissionRecord>(
    `/api/v1/modules/aprendizaje/submissions/${submissionId}/grade`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}

export interface AvailableAssignmentRecord {
  contentId: string;
  contentTitle: string;
  assignmentTitle: string;
  isActive: boolean;
}

export async function listAvailableAssignments(): Promise<AvailableAssignmentRecord[]> {
  return requestApi<AvailableAssignmentRecord[]>(
    '/api/v1/modules/aprendizaje/assignments/available',
  );
}

// ─── Líder (player) ──────────────────────────────────────────────────────────

export async function getAssignmentForLearner(
  contentId: string,
): Promise<AssignmentForLearner | null> {
  return requestApi<AssignmentForLearner | null>(
    `/api/v1/modules/aprendizaje/assignments/${contentId}/play`,
  );
}

export async function upsertMySubmission(
  assignmentId: string,
  input: UpsertSubmissionInput,
): Promise<SubmissionRecord> {
  return requestApi<SubmissionRecord>(
    `/api/v1/modules/aprendizaje/assignments/${assignmentId}/my-submission`,
    { method: 'POST', body: JSON.stringify(input) },
  );
}
