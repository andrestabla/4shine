// ─── Subscription Plan types ─────────────────────────────────────────────────

export type PlanGroup = 'program' | 'circulo' | 'custom';

/** Destino del botón "Comenzar": centro de pagos o asesor por WhatsApp. */
export type CheckoutType = 'payment' | 'whatsapp';

export interface SubscriptionPlanRecord {
  planId: string;
  planCode: string;
  planGroup: PlanGroup;
  name: string;
  description: string;
  highlightLabel: string | null;
  priceAmount: number;
  currencyCode: string;
  durationDays: number;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  checkoutUrl: string | null;
  checkoutType: CheckoutType;
  ctaLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeatureRecord {
  planId: string;
  featureKey: PlanFeatureKey;
  isEnabled: boolean;
  quota: number | null;
}

export interface SubscriptionPlanWithFeatures extends SubscriptionPlanRecord {
  features: PlanFeatureRecord[];
}

export interface CreatePlanInput {
  planCode: string;
  planGroup?: PlanGroup;
  name: string;
  description?: string;
  highlightLabel?: string | null;
  priceAmount: number;
  currencyCode?: string;
  durationDays: number;
  isActive?: boolean;
  sortOrder?: number;
  checkoutUrl?: string | null;
  checkoutType?: CheckoutType;
  ctaLabel?: string | null;
  features?: PlanFeatureInput[];
}

export interface UpdatePlanInput {
  planGroup?: PlanGroup;
  name?: string;
  description?: string;
  highlightLabel?: string | null;
  priceAmount?: number;
  currencyCode?: string;
  durationDays?: number;
  isActive?: boolean;
  sortOrder?: number;
  checkoutUrl?: string | null;
  checkoutType?: CheckoutType;
  ctaLabel?: string | null;
  features?: PlanFeatureInput[];
}

export interface PlanFeatureInput {
  featureKey: PlanFeatureKey;
  isEnabled: boolean;
  quota?: number | null;
}

// ─── Feature catalog ─────────────────────────────────────────────────────────

export type PlanFeatureKey =
  | 'trayectoria'
  | 'descubrimiento'
  | 'aprendizaje_recursos_free'
  | 'aprendizaje_cursos'
  | 'aprendizaje_workbooks'
  | 'mentorias_grupales'
  | 'mentorias_1on1'
  | 'mentorias_comprar'
  | 'networking'
  | 'mensajes'
  | 'convocatorias'
  | 'workshops';

export interface PlanFeatureDef {
  key: PlanFeatureKey;
  moduleCode: string;
  moduleLabel: string;
  label: string;
  description: string;
  supportsQuota: boolean;
}
