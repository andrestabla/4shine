export type DiscoveryStep = "intro" | "instructions" | "quiz" | "results";

export type DiscoveryAnswerValue = string | number;
export type DiscoveryAnswers = Record<string, DiscoveryAnswerValue>;

export type DiscoveryPillarKey = "within" | "out" | "up" | "beyond";
export type DiscoveryReportFilter = "all" | DiscoveryPillarKey;
export type DiscoveryAiReports = Partial<Record<DiscoveryReportFilter, string>>;

export const DISCOVERY_JOB_ROLE_OPTIONS = [
  "Director/C-Level",
  "Gerente/Mando medio",
  "Coordinador",
  "Lider de proyecto con equipo a cargo",
  "Especialista sin personal a cargo",
] as const;

export const DISCOVERY_COUNTRY_OPTIONS = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Ecuador",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
] as const;

export type DiscoveryJobRole = (typeof DISCOVERY_JOB_ROLE_OPTIONS)[number];

export interface DiscoveryParticipantProfile {
  firstName: string;
  lastName: string;
  country: string;
  jobRole: DiscoveryJobRole | "";
  gender: "Hombre" | "Mujer" | "Prefiero no decirlo" | "";
  yearsExperience: number | null;
}

export interface DiscoveryExperienceSurvey {
  answers: Record<string, number>;
  submittedAt: string;
  average: number;
}

export interface DiscoveryUserState {
  name: string;
  answers: DiscoveryAnswers;
  currentIdx: number;
  status: DiscoveryStep;
  profile: DiscoveryParticipantProfile;
  profileCompleted: boolean;
  completionPercent?: number;
  experienceSurvey?: DiscoveryExperienceSurvey | null;
}

export interface DiscoveryCompetencyScore {
  pillar: DiscoveryPillarKey;
  name: string;
  score: number;
}

export interface DiscoveryPillarMetric {
  total: number;
  likert: number;
  sjt: number;
}

export interface DiscoveryScoreResult {
  pillarMetrics: Record<DiscoveryPillarKey, DiscoveryPillarMetric>;
  globalIndex: number;
  compList: DiscoveryCompetencyScore[];
}

export interface DiscoverySessionRecord {
  sessionId: string;
  attemptId: string;
  userId: string;
  nameSnapshot: string;
  status: DiscoveryStep;
  answers: DiscoveryAnswers;
  currentIdx: number;
  completionPercent: number;
  publicId: string | null;
  sharedAt: string | null;
  completedAt: string | null;
  diagnosticIdentifier: string;
  firstName: string;
  lastName: string;
  country: string;
  jobRole: DiscoveryJobRole | "";
  gender: string | null;
  yearsExperience: number | null;
  profileCompleted: boolean;
  experienceSurvey: DiscoveryExperienceSurvey | null;
  aiReports: DiscoveryAiReports;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryContextDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface DiscoveryFeedbackSettingsRecord {
  settingsId: string | null;
  organizationId: string;
  aiFeedbackInstructions: string;
  contextDocuments: DiscoveryContextDocument[];
  inviteEmailSubject: string;
  inviteEmailHtml: string;
  inviteEmailText: string;
  updatedAt: string | null;
}

export interface DiscoveryInvitationRecord {
  invitationId: string;
  sessionId: string | null;
  invitedEmail: string;
  inviteToken: string;
  accessCodeLast4: string;
  accessCodeSentAt: string;
  openedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryInvitationWithCode extends DiscoveryInvitationRecord {
  accessCode: string;
}

export interface DiscoveryOverviewFilters {
  userId?: string;
  country?: string;
  jobRole?: string;
  gender?: string;
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
}

export interface DiscoveryOverviewRow {
  sessionId: string;
  diagnosticIdentifier: string;
  userId: string;
  invitationId: string | null;
  participantName: string;
  sourceType: "platform" | "invited";
  invitedEmail?: string;
  country: string;
  jobRole: string;
  gender: string | null;
  yearsExperience: number | null;
  completionPercent: number;
  globalIndex: number | null;
  updatedAt: string;
  analytics: {
    completion: {
      eligible: number;
      completed: number;
      rate: number;
    };
    generalAverage: number;
    general: Array<{ label: string; value: number }>;
    pillars: Array<{ pillar: DiscoveryPillarKey; label: string; average: number }>;
    components: Array<{ component: string; pillar: DiscoveryPillarKey; average: number; count: number }>;
    componentsTop: Array<{ component: string; pillar: DiscoveryPillarKey; average: number; count: number }>;
    componentsWeak: Array<{ component: string; pillar: DiscoveryPillarKey; average: number; count: number }>;
    satisfaction: {
      responses: number;
      average: number;
      questions: Array<{ question: string; average: number; count: number }>;
    };
  };
}

export interface DiscoveryOverviewStats {
  totalDiagnostics: number;
  completedDiagnostics: number;
  averageGlobalIndex: number;
}

export interface DiscoveryOverviewPayload {
  stats: DiscoveryOverviewStats;
  rows: DiscoveryOverviewRow[];
  analytics: {
    completion: {
      eligible: number;
      completed: number;
      rate: number;
    };
    generalAverage: number;
    general: Array<{ label: string; value: number }>;
    pillars: Array<{ pillar: DiscoveryPillarKey; label: string; average: number }>;
    components: Array<{ component: string; pillar: DiscoveryPillarKey; average: number; count: number }>;
    componentsTop: Array<{ component: string; pillar: DiscoveryPillarKey; average: number; count: number }>;
    componentsWeak: Array<{ component: string; pillar: DiscoveryPillarKey; average: number; count: number }>;
    satisfaction: {
      responses: number;
      average: number;
      questions: Array<{ question: string; average: number; count: number }>;
    };
  };
  availableFilters: {
    users: Array<{ userId: string; name: string }>;
    countries: string[];
    jobRoles: string[];
    genders: string[];
  };
}

export interface DiscoveryOverviewDetailPayload {
  state: DiscoveryUserState;
  scoring: DiscoveryScoreResult;
  experienceSurvey: DiscoveryExperienceSurvey | null;
  aiReports: DiscoveryAiReports;
}

export interface DiscoveryInvitationRequest {
  userId?: string;
  emails: string[];
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
}

export interface DiscoveryInvitationBatchResult {
  session: DiscoverySessionRecord | null;
  invitations: DiscoveryInvitationWithCode[];
  sentCount: number;
}

export interface DiscoveryInvitationAccessPayload {
  invitation: {
    invitationId: string;
    inviteToken: string;
    invitedEmailMasked: string;
    openedAt: string | null;
    meta?: unknown;
  };
  session: DiscoverySessionRecord | null;
  accessMode: "results" | "diagnostic";
  externalProgress: DiscoveryUserState | null;
  alreadyCompleted: boolean;
  externalSurvey: DiscoveryExperienceSurvey | null;
}

export interface UpdateDiscoverySessionInput {
  status?: DiscoveryStep;
  answers?: DiscoveryAnswers;
  currentIdx?: number;
  completionPercent?: number;
  markCompleted?: boolean;
  profile?: Partial<DiscoveryParticipantProfile>;
  experienceSurvey?: DiscoveryExperienceSurvey | null;
}

export interface DiscoveryScoreRow {
  pillarCode: "shine_within" | "shine_out" | "shine_up" | "shine_beyond";
  score: number;
}

export interface DiscoveryStatusDescriptor {
  label: string;
  tone: "emerald" | "amber" | "rose";
  color: string;
  softColor: string;
}
