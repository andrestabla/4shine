export type CommercialProductGroup = "program" | "discovery" | "mentoring_pack";

export type CommercialProductCode =
  | "program_4shine"
  | "discovery_4shine"
  | "mentoring_pack_1"
  | "mentoring_pack_3"
  | "mentoring_pack_5";

export type PurchaseStatus = "active" | "cancelled" | "expired" | "consumed";

export type ViewerAccessTier = "staff" | "subscriber" | "open_leader";

export type PlanTypeCode = "standard" | "premium" | "vip" | "empresa_elite" | null;

export interface CommercialProductRecord {
  productCode: CommercialProductCode;
  productGroup: CommercialProductGroup;
  name: string;
  headline: string;
  description: string;
  priceAmount: number;
  currencyCode: string;
  sessionsIncluded: number;
  highlightLabel: string | null;
  sortOrder: number;
  checkoutUrl: string | null;
  checkoutType: 'payment' | 'whatsapp';
  ctaLabel: string | null;
}

export interface UserPurchaseRecord {
  productCode: CommercialProductCode;
  productGroup: CommercialProductGroup;
  productName: string;
  priceAmount: number;
  currencyCode: string;
  quantity: number;
  sessionsIncluded: number | null;
  purchasedAt: string | null;
  activatedAt: string | null;
  source: string | null;
}

/**
 * Permiso unitario para un feature del plan (mapea a app_billing.plan_module_features).
 * `quota` queda en null cuando el feature no soporta cupos.
 */
export interface PlanFeatureGrant {
  enabled: boolean;
  quota: number | null;
}

/**
 * Plan de suscripción activo del líder. `null` cuando el líder no tiene plan
 * asignado en user_profiles.subscription_plan_id (se usa fallback legacy
 * basado en plan_type / purchases).
 */
export interface ActivePlanInfo {
  planId: string;
  planCode: string;
  planGroup: string;
  name: string;
  highlightLabel: string | null;
  priceAmount: number;
  currencyCode: string;
}

export interface ViewerAccessState {
  viewerTier: ViewerAccessTier;
  planTypeCode: PlanTypeCode;
  /**
   * Inicio del programa para contar las semanas del Camino del líder
   * (subscription_started_at, o el alta del usuario si no hay plan).
   */
  programStartedAt: string | null;
  /** Plan activo del líder (null si no se ha asignado). */
  activePlan: ActivePlanInfo | null;
  /**
   * Diccionario de features del plan activo del líder.
   * Si activePlan es null, queda vacío y se cae al fallback legacy.
   * Keys son PlanFeatureKey de @/features/planes/types.
   */
  planFeatures: Record<string, PlanFeatureGrant>;
  hasProgramSubscription: boolean;
  hasAnyPurchase: boolean;
  hasDiscoveryPurchase: boolean;
  mentorshipSessionCredits: number;
  canAccessTrayectoria: boolean;
  canAccessDescubrimiento: boolean;
  canAccessLearningLibrary: boolean;
  /** Habilita workbooks del programa. */
  canAccessProgramWorkbooks: boolean;
  /** Habilita mentorías (cualquier modalidad). */
  canAccessProgramMentorships: boolean;
  /** Mentorías 1:1 individuales (deriva de feature mentorias_1on1 si hay plan). */
  canAccessMentoring1on1: boolean;
  /** Mentorías grupales (feature mentorias_grupales). */
  canAccessMentoringGroup: boolean;
  canAccessCommunityModules: boolean;
  canAccessNetworking: boolean;
  canAccessMensajes: boolean;
  canAccessConvocatorias: boolean;
  canAccessWorkshops: boolean;
  canAccessAprendizajeCursos: boolean;
  canAccessAprendizajeRecursosFree: boolean;
  freeLearningOnly: boolean;
  purchasedProductCodes: CommercialProductCode[];
  catalog: CommercialProductRecord[];
}
