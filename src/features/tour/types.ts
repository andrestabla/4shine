import type { ModuleCode } from '@/lib/permissions';
import type { TourAnchorArea } from './catalog';

export type TourRole = 'lider' | 'mentor' | 'gestor' | 'admin' | 'invitado';

export const TOUR_ROLES: TourRole[] = ['lider', 'mentor', 'gestor', 'admin', 'invitado'];

export const TOUR_ROLE_LABELS: Record<TourRole, string> = {
  lider: 'Líder',
  mentor: 'Adviser',
  gestor: 'Gestor',
  admin: 'Administrador',
  invitado: 'Invitado',
};

export type TourProgressStatus = 'in_progress' | 'completed' | 'dismissed';

// ─── Admin step records ─────────────────────────────────────────────────────

export interface TourStepRecord {
  stepId: string;
  organizationId: string;
  stepKey: string;
  anchorKey: string;
  title: string;
  bodyHtml: string;
  visibleRoles: TourRole[];
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTourStepInput {
  stepKey?: string;
  anchorKey: string;
  title?: string;
  bodyHtml?: string;
  visibleRoles: TourRole[];
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateTourStepInput = Partial<Omit<CreateTourStepInput, 'stepKey'>>;

export interface ReorderStepsInput {
  orderedStepIds: string[];
}

// ─── Settings ───────────────────────────────────────────────────────────────

export interface TourSettingsRecord {
  organizationId: string;
  currentVersion: number;
  isEnabled: boolean;
  updatedAt: string;
}

export interface UpdateTourSettingsInput {
  isEnabled: boolean;
}

// ─── User-facing payload ────────────────────────────────────────────────────

export interface AppliedTourStep {
  stepKey: string;
  title: string;
  bodyHtml: string;
  sortOrder: number;
  anchor: {
    key: string;
    selector: string;
    route: string | null;
    area: TourAnchorArea;
    moduleCode?: ModuleCode;
  };
}

export interface MyTourPayload {
  enabled: boolean;
  version: number;
  shouldAutoStart: boolean;
  resumeIndex: number;
  status: TourProgressStatus | null;
  steps: AppliedTourStep[];
}

export interface RecordStepInput {
  stepKey: string;
  stepIndex: number;
  totalSteps: number;
}

export interface FinishTourInput {
  status: 'completed' | 'dismissed';
  lastStepKey?: string;
  lastStepIndex?: number;
  totalSteps?: number;
}

export interface TourProgressRecord {
  tourVersion: number;
  roleAtStart: string;
  totalSteps: number;
  lastStepKey: string | null;
  lastStepIndex: number;
  viewedCount: number;
  completionPct: number;
  status: TourProgressStatus;
  startedAt: string;
  completedAt: string | null;
  dismissedAt: string | null;
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export interface TourAnalyticsGlobal {
  started: number;
  completed: number;
  dismissed: number;
  inProgress: number;
  completionRate: number; // 0..100
  avgCompletionPct: number; // 0..100
}

export interface TourAnalyticsRoleRow {
  role: TourRole;
  started: number;
  completed: number;
  dismissed: number;
  inProgress: number;
  avgCompletionPct: number;
}

export interface TourFunnelRoleCell {
  role: TourRole;
  views: number;
}

export interface TourFunnelStep {
  stepKey: string;
  title: string;
  sortOrder: number;
  totalViews: number;
  perRole: TourFunnelRoleCell[];
}

export interface TourAnalytics {
  version: number;
  global: TourAnalyticsGlobal;
  byRole: TourAnalyticsRoleRow[];
  funnel: TourFunnelStep[];
}
