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
}

export interface ViewerAccessState {
  viewerTier: ViewerAccessTier;
  planTypeCode: PlanTypeCode;
  hasProgramSubscription: boolean;
  hasAnyPurchase: boolean;
  hasDiscoveryPurchase: boolean;
  mentorshipSessionCredits: number;
  canAccessTrayectoria: boolean;
  canAccessDescubrimiento: boolean;
  canAccessLearningLibrary: boolean;
  canAccessProgramWorkbooks: boolean;
  canAccessProgramMentorships: boolean;
  canAccessCommunityModules: boolean;
  freeLearningOnly: boolean;
  purchasedProductCodes: CommercialProductCode[];
  catalog: CommercialProductRecord[];
}
