export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'numeric'
  | 'ordering'
  | 'matching'
  | 'classification'
  | 'hotspot';

export interface ChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface SingleChoicePayload {
  options: ChoiceOption[];
}

export interface MultipleChoicePayload {
  options: ChoiceOption[];
  /** Si true, se cuenta correcta solo si el set coincide exacto. Si false, puntaje parcial. */
  strictAll: boolean;
}

export interface TrueFalsePayload {
  correctAnswer: boolean;
}

export interface FillBlankPayload {
  acceptedAnswers: string[];
  caseInsensitive: boolean;
  accentInsensitive: boolean;
}

export interface NumericPayload {
  correctValue: number;
  tolerance: number;
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface OrderingPayload {
  items: OrderingItem[];
  /** Array de ids en el orden correcto. */
  correctOrder: string[];
}

// ─── Phase 2 types ──────────────────────────────────────────────────────────

export interface MatchingItem {
  id: string;
  text: string;
}

export interface MatchingPayload {
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  /** Pares correctos como tuplas [leftId, rightId]. */
  correctPairs: Array<[string, string]>;
}

export interface ClassificationBucket {
  id: string;
  label: string;
}

export interface ClassificationItem {
  id: string;
  text: string;
  correctBucketId: string;
}

export interface ClassificationPayload {
  buckets: ClassificationBucket[];
  items: ClassificationItem[];
}

export interface HotspotPayload {
  imageUrl: string;
  /** Centro y radio en proporciones 0..1 del ancho/alto de la imagen. */
  correctRegion: { x: number; y: number; radius: number };
}

export type QuestionPayload =
  | SingleChoicePayload
  | MultipleChoicePayload
  | TrueFalsePayload
  | FillBlankPayload
  | NumericPayload
  | OrderingPayload
  | MatchingPayload
  | ClassificationPayload
  | HotspotPayload;

export interface ActivityQuestion {
  questionId: string;
  sortOrder: number;
  type: QuestionType;
  prompt: string;
  explanation: string | null;
  points: number;
  payload: QuestionPayload;
}

export interface ActivityRecord {
  activityId: string;
  contentId: string;
  title: string;
  instructions: string | null;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  questions: ActivityQuestion[];
  createdAt: string;
  updatedAt: string;
}

/** Versión "segura" para el líder (sin exponer correctAnswer / isCorrect). */
export interface ActivityForLearner {
  activityId: string;
  contentId: string;
  title: string;
  instructions: string | null;
  passingScore: number;
  maxAttempts: number;
  questions: Array<{
    questionId: string;
    sortOrder: number;
    type: QuestionType;
    prompt: string;
    points: number;
    payload: unknown; // sanitized — sin .isCorrect, .correctAnswer, .correctValue, .acceptedAnswers, .correctOrder
  }>;
  userAttempts: AttemptSummary[];
}

export interface AttemptSummary {
  attemptId: string;
  status: 'in_progress' | 'submitted' | 'abandoned';
  scorePercent: number | null;
  pointsEarned: number;
  pointsPossible: number;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface SubmitAnswerInput {
  questionId: string;
  answer: unknown; // shape varies per type
}

export interface SubmitAttemptResult {
  attemptId: string;
  scorePercent: number;
  pointsEarned: number;
  pointsPossible: number;
  passed: boolean;
  perQuestion: Array<{
    questionId: string;
    isCorrect: boolean;
    pointsEarned: number;
    pointsPossible: number;
    explanation: string | null;
  }>;
}

export interface UpsertActivityInput {
  contentId: string;
  title: string;
  instructions?: string | null;
  passingScore?: number;
  maxAttempts?: number;
  isActive?: boolean;
  questions: Array<{
    questionId?: string;
    type: QuestionType;
    prompt: string;
    explanation?: string | null;
    points?: number;
    payload: QuestionPayload;
  }>;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface ActivityAggregateStats {
  activityId: string;
  totalAttempts: number;
  uniqueUsers: number;
  avgScore: number | null;
  passRate: number | null;
  questionStats: Array<{
    questionId: string;
    prompt: string;
    correctRate: number | null;
    avgPoints: number | null;
    totalAnswers: number;
  }>;
}

export interface ActivityUserResult {
  userId: string;
  userName: string;
  userEmail: string;
  attempts: number;
  bestScore: number | null;
  lastScore: number | null;
  lastSubmittedAt: string | null;
  passed: boolean;
}
