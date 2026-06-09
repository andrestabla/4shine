import { requestApi } from '@/lib/api-client';
import type {
  ActivityRecord,
  ActivityForLearner,
  ActivityAggregateStats,
  ActivityUserResult,
  SubmitAnswerInput,
  SubmitAttemptResult,
  UpsertActivityInput,
} from './types';

export type * from './types';

// ─── Admin/Gestor/Adviser ────────────────────────────────────────────────────

export async function getActivityForContentAdmin(contentId: string): Promise<ActivityRecord | null> {
  return requestApi<ActivityRecord | null>(
    `/api/v1/modules/aprendizaje/activities/${contentId}`,
  );
}

export async function upsertActivity(input: UpsertActivityInput): Promise<ActivityRecord> {
  return requestApi<ActivityRecord>(
    `/api/v1/modules/aprendizaje/activities/${input.contentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteActivity(contentId: string): Promise<void> {
  await requestApi(`/api/v1/modules/aprendizaje/activities/${contentId}`, {
    method: 'DELETE',
  });
}

export async function getActivityStats(activityId: string): Promise<ActivityAggregateStats> {
  return requestApi<ActivityAggregateStats>(
    `/api/v1/modules/aprendizaje/activities/${activityId}/stats`,
  );
}

export async function listActivityUsers(activityId: string): Promise<ActivityUserResult[]> {
  return requestApi<ActivityUserResult[]>(
    `/api/v1/modules/aprendizaje/activities/${activityId}/users`,
  );
}

// ─── Líder (player) ──────────────────────────────────────────────────────────

export async function getActivityForLearner(contentId: string): Promise<ActivityForLearner | null> {
  return requestApi<ActivityForLearner | null>(
    `/api/v1/modules/aprendizaje/activities/${contentId}/play`,
  );
}

export async function startActivityAttempt(activityId: string): Promise<{ attemptId: string }> {
  return requestApi<{ attemptId: string }>(
    `/api/v1/modules/aprendizaje/activities/${activityId}/attempts`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export async function submitActivityAttempt(
  attemptId: string,
  answers: SubmitAnswerInput[],
): Promise<SubmitAttemptResult> {
  return requestApi<SubmitAttemptResult>(
    `/api/v1/modules/aprendizaje/attempts/${attemptId}/submit`,
    { method: 'POST', body: JSON.stringify({ answers }) },
  );
}
