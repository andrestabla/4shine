export type DiscoveryStep = "intro" | "instructions" | "quiz" | "results";

export const DISCOVERY_ROLE_OPTIONS = [
  "Director/C-Level",
  "Gerente/Mando Medio",
  "Coordinador/Líder de Proyecto",
  "Individual Contributor",
] as const;

export type DiscoveryRoleSnapshot = (typeof DISCOVERY_ROLE_OPTIONS)[number];

export type DiscoveryAnswerValue = string | number;
export type DiscoveryAnswers = Record<string, DiscoveryAnswerValue>;

export type DiscoveryPillarKey = "within" | "out" | "up" | "beyond";
export type DiscoveryReportFilter = "all" | DiscoveryPillarKey;

export interface DiscoveryUserState {
  name: string;
  role: DiscoveryRoleSnapshot;
  answers: DiscoveryAnswers;
  currentIdx: number;
  status: DiscoveryStep;
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
  roleSnapshot: DiscoveryRoleSnapshot;
  status: DiscoveryStep;
  answers: DiscoveryAnswers;
  currentIdx: number;
  completionPercent: number;
  publicId: string | null;
  sharedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDiscoverySessionInput {
  roleSnapshot?: DiscoveryRoleSnapshot;
  status?: DiscoveryStep;
  answers?: DiscoveryAnswers;
  currentIdx?: number;
  completionPercent?: number;
  markCompleted?: boolean;
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

