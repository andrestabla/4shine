import { requestApi } from '@/lib/api-client';
import type {
  AssignCourseResult,
  MentorTrainingCourse,
  MentorTrainingOverview,
  MentorTrainingRow,
  MentorTrainingStats,
  TrainingStatus,
} from './service';

export type {
  AssignCourseResult,
  MentorTrainingCourse,
  MentorTrainingOverview,
  MentorTrainingRow,
  MentorTrainingStats,
  TrainingStatus,
};

export async function getMentorTrainingOverview(
  contentId?: string | null,
): Promise<MentorTrainingOverview> {
  const query = contentId ? `?contentId=${encodeURIComponent(contentId)}` : '';
  return requestApi<MentorTrainingOverview>(`/api/v1/modules/gestion-formacion-mentores${query}`);
}

export async function assignMentorCourse(input: {
  contentId: string;
  userIds: string[];
}): Promise<AssignCourseResult> {
  return requestApi<AssignCourseResult>('/api/v1/modules/gestion-formacion-mentores/asignaciones', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function unassignMentorCourse(input: {
  contentId: string;
  userIds: string[];
}): Promise<{ removed: number }> {
  return requestApi<{ removed: number }>('/api/v1/modules/gestion-formacion-mentores/asignaciones', {
    method: 'DELETE',
    body: JSON.stringify(input),
  });
}
