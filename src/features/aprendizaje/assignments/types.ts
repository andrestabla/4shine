export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'graded'
  | 'rejected'
  | 'revision_requested';

export interface AssignmentFile {
  url: string;
  name: string;
  size?: number | null;
}

export interface ContentAssignmentRecord {
  assignmentId: string;
  contentId: string;
  title: string;
  instructions: string;
  evaluationCriteria: string;
  maxScore: number;
  passingScore: number;
  acceptFiles: boolean;
  acceptUrl: boolean;
  acceptText: boolean;
  maxFiles: number;
  allowMultipleSubmissions: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAssignmentInput {
  contentId: string;
  title: string;
  instructions?: string;
  evaluationCriteria?: string;
  maxScore?: number;
  passingScore?: number;
  acceptFiles?: boolean;
  acceptUrl?: boolean;
  acceptText?: boolean;
  maxFiles?: number;
  allowMultipleSubmissions?: boolean;
  isActive?: boolean;
}

export interface SubmissionRecord {
  submissionId: string;
  assignmentId: string;
  userId: string;
  status: SubmissionStatus;
  submissionText: string | null;
  submissionUrl: string | null;
  submissionFiles: AssignmentFile[];
  score: number | null;
  passed: boolean | null;
  graderFeedback: string | null;
  graderName: string | null;
  graderId: string | null;
  gradedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionUserRecord extends SubmissionRecord {
  userName: string;
  userEmail: string;
}

export interface AssignmentForLearner extends ContentAssignmentRecord {
  mySubmissions: SubmissionRecord[];
}

export interface UpsertSubmissionInput {
  submissionText?: string | null;
  submissionUrl?: string | null;
  submissionFiles?: AssignmentFile[];
  /** Si true, marca como enviada (submitted). Si false o omit, queda en draft. */
  submit?: boolean;
}

export interface GradeSubmissionInput {
  score: number;
  passed?: boolean;
  graderFeedback?: string | null;
  status?: 'graded' | 'rejected' | 'revision_requested';
}

export interface AssignmentSummary {
  assignmentId: string;
  contentId: string;
  contentTitle: string;
  title: string;
  totalSubmissions: number;
  pendingReview: number;
  graded: number;
}
