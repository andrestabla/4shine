import { requestApi } from '@/lib/api-client';

export interface ParticipantSummary {
  userId: string;
  name: string;
  email: string;
  progressPercent: number;
  lastSeenAt: string | null;
  activityResults: Record<string, {
    attempts: number;
    bestScore: number | null;
    passed: boolean;
    lastAttemptAt: string | null;
  }>;
  taskResults: Record<string, {
    status: 'none' | 'draft' | 'submitted' | 'graded' | 'rejected' | 'revision_requested';
    latestSubmissionId: string | null;
    score: number | null;
    passed: boolean | null;
    submittedAt: string | null;
    gradedAt: string | null;
  }>;
}

export interface CourseActivityRef {
  resourceContentId: string;
  resourceTitle: string;
  activityContentId: string;
  activityId: string;
  activityTitle: string;
  questionCount: number;
  passingScore: number;
}

export interface CourseTaskRef {
  resourceContentId: string;
  resourceTitle: string;
  taskContentId: string;
  taskId: string;
  taskTitle: string;
  maxScore: number;
  passingScore: number;
}

export interface CourseParticipationReport {
  contentId: string;
  contentTitle: string;
  activities: CourseActivityRef[];
  tasks: CourseTaskRef[];
  participants: ParticipantSummary[];
  totals: {
    totalParticipants: number;
    averageProgress: number;
    pendingTaskReviews: number;
    activitiesPassedTotal: number;
    activitiesAttemptedTotal: number;
  };
}

export async function getCourseParticipation(contentId: string): Promise<CourseParticipationReport> {
  return requestApi<CourseParticipationReport>(
    `/api/v1/modules/aprendizaje/courses/${contentId}/participation`,
  );
}
