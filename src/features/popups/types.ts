export type PopupTrigger = 'time' | 'scroll' | 'exit_intent' | 'immediate';
export type PopupFrequency = 'session' | 'daily' | 'once' | 'always';
export type PopupTargetMode = 'all' | 'include';
export type PopupRole = 'lider' | 'mentor' | 'gestor' | 'admin' | 'invitado';

export const POPUP_ROLES: PopupRole[] = ['lider', 'mentor', 'gestor', 'admin', 'invitado'];

export const POPUP_ROLE_LABELS: Record<PopupRole, string> = {
  lider: 'Líder',
  mentor: 'Adviser',
  gestor: 'Gestor',
  admin: 'Administrador',
  invitado: 'Invitado',
};

export interface PopupRecord {
  popupId: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  triggerType: PopupTrigger;
  delaySeconds: number;
  scrollPercent: number;
  targetMode: PopupTargetMode;
  targetPaths: string[];
  targetRoles: PopupRole[];
  targetPlans: string[];
  frequency: PopupFrequency;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  dismissLabel: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePopupInput {
  name?: string;
  isActive?: boolean;
  triggerType?: PopupTrigger;
  delaySeconds?: number;
  scrollPercent?: number;
  targetMode?: PopupTargetMode;
  targetPaths?: string[];
  targetRoles?: PopupRole[];
  targetPlans?: string[];
  frequency?: PopupFrequency;
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  dismissLabel?: string;
  sortOrder?: number;
}

export type UpdatePopupInput = Partial<CreatePopupInput>;

/** Subconjunto que necesita el runtime público (sin metadatos internos). */
export interface PublicPopup {
  popupId: string;
  triggerType: PopupTrigger;
  delaySeconds: number;
  scrollPercent: number;
  targetMode: PopupTargetMode;
  targetPaths: string[];
  frequency: PopupFrequency;
  title: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  dismissLabel: string;
}

export const POPUP_TRIGGER_LABELS: Record<PopupTrigger, string> = {
  time: 'Por tiempo',
  scroll: 'Por scroll',
  exit_intent: 'Al intentar salir',
  immediate: 'Inmediato',
};

export const POPUP_FREQUENCY_LABELS: Record<PopupFrequency, string> = {
  session: '1 vez por sesión',
  daily: '1 vez por día',
  once: 'Una sola vez',
  always: 'Siempre',
};
