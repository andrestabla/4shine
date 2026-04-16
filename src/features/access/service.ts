import type { PoolClient } from "pg";
import { ForbiddenError } from "@/server/auth/module-permissions";
import type { AuthUser } from "@/server/auth/types";
import type {
  CommercialProductCode,
  CommercialProductGroup,
  CommercialProductRecord,
  PlanTypeCode,
  PurchaseStatus,
  ViewerAccessState,
} from "./types";

interface ProductRow {
  product_code: CommercialProductCode;
  product_group: CommercialProductGroup;
  name: string;
  headline: string;
  description: string;
  price_amount: string | number;
  currency_code: string;
  sessions_included: number | null;
  highlight_label: string | null;
  sort_order: number;
}

interface PurchaseRow {
  product_code: CommercialProductCode;
  product_group: CommercialProductGroup;
  status: PurchaseStatus;
  quantity: number;
  sessions_included: number | null;
}

const SUBSCRIBED_PLAN_TYPES = new Set<Exclude<PlanTypeCode, null>>([
  "premium",
  "vip",
  "empresa_elite",
]);

function mapProductRow(row: ProductRow): CommercialProductRecord {
  return {
    productCode: row.product_code,
    productGroup: row.product_group,
    name: row.name,
    headline: row.headline,
    description: row.description,
    priceAmount: Number(row.price_amount ?? 0),
    currencyCode: row.currency_code,
    sessionsIncluded: Number(row.sessions_included ?? 0),
    highlightLabel: row.highlight_label,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

async function listCatalog(client: PoolClient): Promise<CommercialProductRecord[]> {
  const { rows } = await client.query<ProductRow>(
    `
      SELECT
        product_code,
        product_group,
        name,
        headline,
        description,
        price_amount,
        currency_code,
        sessions_included,
        highlight_label,
        sort_order
      FROM app_billing.product_catalog
      WHERE is_active = true
      ORDER BY sort_order, name
    `,
  );

  return rows.map(mapProductRow);
}

async function readPlanTypeCode(client: PoolClient, userId: string): Promise<PlanTypeCode> {
  const { rows } = await client.query<{ plan_type: PlanTypeCode }>(
    `
      SELECT up.plan_type
      FROM app_core.user_profiles up
      WHERE up.user_id = $1::uuid
      LIMIT 1
    `,
    [userId],
  );

  return rows[0]?.plan_type ?? null;
}

async function listActivePurchases(client: PoolClient, userId: string): Promise<PurchaseRow[]> {
  const { rows } = await client.query<PurchaseRow>(
    `
      SELECT
        up.product_code,
        pc.product_group,
        up.status,
        up.quantity,
        pc.sessions_included
      FROM app_billing.user_purchases up
      JOIN app_billing.product_catalog pc ON pc.product_code = up.product_code
      WHERE up.user_id = $1::uuid
        AND up.status = 'active'
      ORDER BY up.created_at DESC
    `,
    [userId],
  );

  return rows;
}

export async function getViewerAccessState(
  client: PoolClient,
  actor: Pick<AuthUser, "userId" | "role">,
  options?: { includeCatalog?: boolean },
): Promise<ViewerAccessState> {
  const includeCatalog = options?.includeCatalog ?? true;
  const catalogPromise = includeCatalog ? listCatalog(client) : Promise.resolve([]);

  if (actor.role !== "lider") {
    if (actor.role === "invitado") {
      return {
        viewerTier: "staff",
        planTypeCode: null,
        hasProgramSubscription: false,
        hasAnyPurchase: false,
        hasDiscoveryPurchase: true,
        mentorshipSessionCredits: 0,
        canAccessTrayectoria: false,
        canAccessDescubrimiento: true,
        canAccessLearningLibrary: false,
        canAccessProgramWorkbooks: false,
        canAccessProgramMentorships: false,
        canAccessCommunityModules: false,
        freeLearningOnly: true,
        purchasedProductCodes: [],
        catalog: await catalogPromise,
      };
    }

    return {
      viewerTier: "staff",
      planTypeCode: null,
      hasProgramSubscription: true,
      hasAnyPurchase: true,
      hasDiscoveryPurchase: true,
      mentorshipSessionCredits: 0,
      canAccessTrayectoria: true,
      canAccessDescubrimiento: true,
      canAccessLearningLibrary: true,
      canAccessProgramWorkbooks: true,
      canAccessProgramMentorships: true,
      canAccessCommunityModules: true,
      freeLearningOnly: false,
      purchasedProductCodes: [],
      catalog: await catalogPromise,
    };
  }

  const [planTypeCode, purchases, catalog] = await Promise.all([
    readPlanTypeCode(client, actor.userId),
    listActivePurchases(client, actor.userId),
    catalogPromise,
  ]);

  const purchasedProductCodes = Array.from(
    new Set(purchases.map((purchase) => purchase.product_code)),
  );
  const hasProgramPurchase = purchases.some(
    (purchase) => purchase.product_group === "program",
  );
  const hasDiscoveryPurchase = purchases.some(
    (purchase) => purchase.product_group === "discovery",
  );
  const mentorshipSessionCredits = purchases.reduce((total, purchase) => {
    if (purchase.product_group !== "mentoring_pack") {
      return total;
    }

    return total + Number(purchase.quantity ?? 0) * Number(purchase.sessions_included ?? 0);
  }, 0);

  const hasProgramSubscription =
    SUBSCRIBED_PLAN_TYPES.has(planTypeCode ?? "standard") || hasProgramPurchase;
  const hasAnyPurchase =
    hasProgramSubscription || hasDiscoveryPurchase || mentorshipSessionCredits > 0;

  return {
    viewerTier: hasProgramSubscription ? "subscriber" : "open_leader",
    planTypeCode,
    hasProgramSubscription,
    hasAnyPurchase,
    hasDiscoveryPurchase,
    mentorshipSessionCredits,
    canAccessTrayectoria: hasProgramSubscription,
    canAccessDescubrimiento: hasProgramSubscription || hasDiscoveryPurchase,
    canAccessLearningLibrary: hasProgramSubscription,
    canAccessProgramWorkbooks: hasProgramSubscription,
    canAccessProgramMentorships: hasProgramSubscription,
    canAccessCommunityModules: hasProgramSubscription,
    freeLearningOnly: !hasProgramSubscription,
    purchasedProductCodes,
    catalog,
  };
}

async function readAccessStateForActor(
  client: PoolClient,
  actor: AuthUser,
): Promise<ViewerAccessState> {
  return getViewerAccessState(client, actor, { includeCatalog: false });
}

export async function requireProgramSubscriptionAccess(
  client: PoolClient,
  actor: AuthUser,
  featureLabel: string,
): Promise<ViewerAccessState> {
  const access = await readAccessStateForActor(client, actor);
  if (actor.role === "lider" && !access.hasProgramSubscription) {
    throw new ForbiddenError(
      `${featureLabel} requiere plan 4Shine activo para líderes sin suscripción.`,
    );
  }
  return access;
}

export async function requireDiscoveryAccess(
  client: PoolClient,
  actor: AuthUser,
): Promise<ViewerAccessState> {
  const access = await readAccessStateForActor(client, actor);
  if (actor.role === "lider" && !access.canAccessDescubrimiento) {
    throw new ForbiddenError(
      "Descubrimiento requiere plan 4Shine o compra del diagnóstico para esta cuenta.",
    );
  }
  return access;
}

export async function requireCommunityAccess(
  client: PoolClient,
  actor: AuthUser,
  featureLabel: string,
): Promise<ViewerAccessState> {
  const access = await readAccessStateForActor(client, actor);
  if (actor.role === "lider" && !access.canAccessCommunityModules) {
    throw new ForbiddenError(
      `${featureLabel} está disponible con plan 4Shine activo.`,
    );
  }
  return access;
}
