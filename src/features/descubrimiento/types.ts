export type DiscoveryStep = "intro" | "instructions" | "quiz" | "results";

export type DiscoveryAnswerValue = string | number;
export type DiscoveryAnswers = Record<string, DiscoveryAnswerValue>;

export type DiscoveryPillarKey = "within" | "out" | "up" | "beyond";
export type DiscoveryReportFilter = "all" | DiscoveryPillarKey;

export const DISCOVERY_JOB_ROLE_OPTIONS = [
  "Director/C-Level",
  "Gerente/Mando medio",
  "Coordinador",
  "Lider de proyecto con equipo a cargo",
  "Individual contributor",
] as const;

export type DiscoveryJobRole = (typeof DISCOVERY_JOB_ROLE_OPTIONS)[number];

export interface DiscoveryParticipantProfile {
  firstName: string;
  lastName: string;
  country: string;
  jobRole: DiscoveryJobRole | "";
  age: number | null;
  yearsExperience: number | null;
}

export interface DiscoveryUserState {
  name: string;
  answers: DiscoveryAnswers;
  currentIdx: number;
  status: DiscoveryStep;
  profile: DiscoveryParticipantProfile;
  profileCompleted: boolean;
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
  age: number | null;
  yearsExperience: number | null;
  profileCompleted: boolean;
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
  ageMin?: number;
  ageMax?: number;
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
}

export interface DiscoveryOverviewRow {
  sessionId: string;
  diagnosticIdentifier: string;
  userId: string;
  participantName: string;
  sourceType: "platform" | "invited";
  invitedEmail?: string;
  country: string;
  jobRole: string;
  age: number | null;
  yearsExperience: number | null;
  completionPercent: number;
  globalIndex: number | null;
  updatedAt: string;
}

export interface DiscoveryOverviewStats {
  totalDiagnostics: number;
  completedDiagnostics: number;
  averageGlobalIndex: number;
}

export interface DiscoveryOverviewPayload {
  stats: DiscoveryOverviewStats;
  rows: DiscoveryOverviewRow[];
  availableFilters: {
    users: Array<{ userId: string; name: string }>;
    countries: string[];
    jobRoles: string[];
  };
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
  };
  session: DiscoverySessionRecord | null;
  accessMode: "results" | "diagnostic";
  externalProgress: DiscoveryUserState | null;
  alreadyCompleted: boolean;
}

export interface UpdateDiscoverySessionInput {
  status?: DiscoveryStep;
  answers?: DiscoveryAnswers;
  currentIdx?: number;
  completionPercent?: number;
  markCompleted?: boolean;
  profile?: Partial<DiscoveryParticipantProfile>;
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
