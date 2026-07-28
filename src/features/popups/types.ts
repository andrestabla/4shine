export type PopupTrigger = 'time' | 'scroll' | 'exit_intent' | 'immediate';
export type PopupDisplayMode = 'popup' | 'banner';
export type BannerStyle = 'brand' | 'gold' | 'navy' | 'light' | 'custom';

/** Personalización visual del banner (vacío/0 = usar el estilo elegido). */
export interface BannerVisuals {
  bannerBgStart: string;
  bannerBgEnd: string;
  bannerTextColor: string;
  bannerCtaColor: string;
  bannerImageUrl: string;
  bannerMinHeight: number;
}
export type PopupSubscriptionTarget = 'any' | 'without_plan' | 'with_plan';
export type PopupFrequency = 'session' | 'daily' | 'once' | 'always';
export type PopupTargetMode = 'all' | 'include';
export type PopupRole = 'lider' | 'mentor' | 'gestor' | 'admin' | 'invitado';

export const POPUP_ROLES: PopupRole[] = ['lider', 'mentor', 'gestor', 'admin', 'invitado'];

export const POPUP_ROLE_LABELS: Record<PopupRole, string> = {
  lider: 'Líder',
  mentor: 'Advisor',
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
  targetSubscription: PopupSubscriptionTarget;
  displayMode: PopupDisplayMode;
  bannerStyle: BannerStyle;
  bannerBgStart: string;
  bannerBgEnd: string;
  bannerTextColor: string;
  bannerCtaColor: string;
  bannerImageUrl: string;
  bannerMinHeight: number;
  bannerKicker: string;
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
  targetSubscription?: PopupSubscriptionTarget;
  displayMode?: PopupDisplayMode;
  bannerStyle?: BannerStyle;
  bannerBgStart?: string;
  bannerBgEnd?: string;
  bannerTextColor?: string;
  bannerCtaColor?: string;
  bannerImageUrl?: string;
  bannerMinHeight?: number;
  bannerKicker?: string;
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
  displayMode: PopupDisplayMode;
  bannerStyle: BannerStyle;
  bannerBgStart: string;
  bannerBgEnd: string;
  bannerTextColor: string;
  bannerCtaColor: string;
  bannerImageUrl: string;
  bannerMinHeight: number;
  bannerKicker: string;
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

export const BANNER_STYLE_LABELS: Record<BannerStyle, string> = {
  brand: 'Marca (navy + dorado)',
  gold: 'Dorado',
  navy: 'Navy minimal',
  light: 'Claro',
  custom: 'Personalizado',
};

export const SUBSCRIPTION_TARGET_LABELS: Record<PopupSubscriptionTarget, string> = {
  any: 'Cualquier usuario',
  without_plan: 'Sin suscripción activa',
  with_plan: 'Con suscripción activa',
};

export const POPUP_FREQUENCY_LABELS: Record<PopupFrequency, string> = {
  session: '1 vez por sesión',
  daily: '1 vez por día',
  once: 'Una sola vez',
  always: 'Siempre',
};
