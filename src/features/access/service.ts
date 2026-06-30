import type { PoolClient } from "pg";
import { ForbiddenError } from "@/server/auth/module-permissions";
import type { AuthUser } from "@/server/auth/types";
import type {
  ActivePlanInfo,
  CommercialProductCode,
  CommercialProductGroup,
  CommercialProductRecord,
  PlanFeatureGrant,
  PlanTypeCode,
  PurchaseStatus,
  UserPurchaseRecord,
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
  checkout_url: string | null;
  checkout_type: string | null;
  cta_label: string | null;
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
    checkoutUrl: row.checkout_url ?? null,
    checkoutType: row.checkout_type === 'whatsapp' ? 'whatsapp' : 'payment',
    ctaLabel: row.cta_label ?? null,
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
        sort_order,
        checkout_url,
        checkout_type,
        cta_label
      FROM app_billing.product_catalog
      WHERE is_active = true
      ORDER BY sort_order, name
    `,
  );

  return rows.map(mapProductRow);
}

/** Catálogo público de productos puntuales activos (diagnóstico, packs de mentoría). */
export function listActiveProducts(client: PoolClient): Promise<CommercialProductRecord[]> {
  return listCatalog(client);
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

interface ActivePlanRow {
  plan_id: string;
  plan_code: string;
  plan_group: string;
  name: string;
  highlight_label: string | null;
  price_amount: string | number;
  currency_code: string;
}

/**
 * Lee el plan de suscripción activo y vigente del líder (vía
 * user_profiles.subscription_plan_id) junto con sus features
 * configuradas en /dashboard/administracion/planes.
 *
 * Devuelve null si:
 *  - el líder no tiene plan asignado,
 *  - el plan está marcado como inactivo,
 *  - o la suscripción del usuario ya venció (subscription_expires_at < now()).
 *
 * Cuando el plan vence, el líder cae automáticamente al fallback de
 * compras/legacy y aparece como "líder sin suscripción".
 */
async function readActivePlanWithFeatures(
  client: PoolClient,
  userId: string,
): Promise<{ plan: ActivePlanInfo; features: Record<string, PlanFeatureGrant> } | null> {
  const { rows: planRows } = await client.query<ActivePlanRow>(
    `
      SELECT
        sp.plan_id::text,
        sp.plan_code,
        sp.plan_group::text AS plan_group,
        sp.name,
        sp.highlight_label,
        sp.price_amount,
        sp.currency_code
      FROM app_core.user_profiles up
      JOIN app_billing.subscription_plans sp
        ON sp.plan_id = up.subscription_plan_id
      WHERE up.user_id = $1::uuid
        AND sp.is_active = true
        AND (
          up.subscription_expires_at IS NULL
          OR up.subscription_expires_at > now()
        )
      LIMIT 1
    `,
    [userId],
  );

  const planRow = planRows[0];
  if (!planRow) return null;

  const { rows: featureRows } = await client.query<{
    feature_key: string;
    is_enabled: boolean;
    quota: number | string | null;
  }>(
    `
      SELECT feature_key, is_enabled, quota
      FROM app_billing.plan_module_features
      WHERE plan_id = $1::uuid
    `,
    [planRow.plan_id],
  );

  const features: Record<string, PlanFeatureGrant> = {};
  for (const row of featureRows) {
    const quotaRaw =
      row.quota === null || row.quota === undefined ? null : Number(row.quota);
    features[row.feature_key] = {
      enabled: !!row.is_enabled,
      quota: Number.isFinite(quotaRaw) ? quotaRaw : null,
    };
  }

  return {
    plan: {
      planId: planRow.plan_id,
      planCode: planRow.plan_code,
      planGroup: planRow.plan_group,
      name: planRow.name,
      highlightLabel: planRow.highlight_label,
      priceAmount: Number(planRow.price_amount ?? 0),
      currencyCode: planRow.currency_code,
    },
    features,
  };
}

function featureEnabled(
  features: Record<string, PlanFeatureGrant>,
  key: string,
): boolean {
  const grant = features[key];
  return !!grant && grant.enabled;
}

interface UserPurchaseRow {
  product_code: CommercialProductCode;
  product_group: CommercialProductGroup;
  product_name: string;
  unit_price_amount: string | number | null;
  currency_code: string;
  quantity: number;
  sessions_included: number | null;
  purchased_at: string | null;
  activated_at: string | null;
  metadata: Record<string, unknown> | null;
}

export async function listUserPurchases(
  client: PoolClient,
  userId: string,
): Promise<UserPurchaseRecord[]> {
  const { rows } = await client.query<UserPurchaseRow>(
    `
      SELECT
        up.product_code,
        pc.product_group,
        pc.name AS product_name,
        COALESCE(up.unit_price_amount, pc.price_amount) AS unit_price_amount,
        COALESCE(up.currency_code, pc.currency_code) AS currency_code,
        up.quantity,
        pc.sessions_included,
        up.purchased_at::text,
        up.activated_at::text,
        up.metadata
      FROM app_billing.user_purchases up
      JOIN app_billing.product_catalog pc ON pc.product_code = up.product_code
      WHERE up.user_id = $1::uuid
        AND up.status = 'active'
      ORDER BY up.purchased_at DESC NULLS LAST, up.created_at DESC
    `,
    [userId],
  );

  return rows.map((row) => ({
    productCode: row.product_code,
    productGroup: row.product_group,
    productName: row.product_name,
    priceAmount: Number(row.unit_price_amount ?? 0),
    currencyCode: row.currency_code,
    quantity: Number(row.quantity ?? 1),
    sessionsIncluded: row.sessions_included ?? null,
    purchasedAt: row.purchased_at,
    activatedAt: row.activated_at,
    source:
      row.metadata && typeof row.metadata === "object" && typeof row.metadata.source === "string"
        ? (row.metadata.source as string)
        : null,
  }));
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
        activePlan: null,
        planFeatures: {},
        hasProgramSubscription: false,
        hasAnyPurchase: false,
        hasDiscoveryPurchase: true,
        mentorshipSessionCredits: 0,
        canAccessTrayectoria: false,
        canAccessDescubrimiento: true,
        canAccessLearningLibrary: false,
        canAccessProgramWorkbooks: false,
        canAccessProgramMentorships: false,
        canAccessMentoring1on1: false,
        canAccessMentoringGroup: false,
        canAccessCommunityModules: false,
        canAccessNetworking: false,
        canAccessMensajes: false,
        canAccessConvocatorias: false,
        canAccessWorkshops: false,
        canAccessAprendizajeCursos: false,
        canAccessAprendizajeRecursosFree: false,
        freeLearningOnly: true,
        purchasedProductCodes: [],
        catalog: await catalogPromise,
      };
    }

    // admin / gestor / mentor / advisor → acceso completo, sin gating por plan.
    return {
      viewerTier: "staff",
      planTypeCode: null,
      activePlan: null,
      planFeatures: {},
      hasProgramSubscription: true,
      hasAnyPurchase: true,
      hasDiscoveryPurchase: true,
      mentorshipSessionCredits: 0,
      canAccessTrayectoria: true,
      canAccessDescubrimiento: true,
      canAccessLearningLibrary: true,
      canAccessProgramWorkbooks: true,
      canAccessProgramMentorships: true,
      canAccessMentoring1on1: true,
      canAccessMentoringGroup: true,
      canAccessCommunityModules: true,
      canAccessNetworking: true,
      canAccessMensajes: true,
      canAccessConvocatorias: true,
      canAccessWorkshops: true,
      canAccessAprendizajeCursos: true,
      canAccessAprendizajeRecursosFree: true,
      freeLearningOnly: false,
      purchasedProductCodes: [],
      catalog: await catalogPromise,
    };
  }

  const [planTypeCode, purchases, planWithFeatures, catalog] = await Promise.all([
    readPlanTypeCode(client, actor.userId),
    listActivePurchases(client, actor.userId),
    readActivePlanWithFeatures(client, actor.userId),
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

  // Si el líder tiene un plan asignado en /administracion/planes, esa es la
  // fuente de verdad. Si no, caemos al modelo legacy (plan_type + purchases).
  const activePlan = planWithFeatures?.plan ?? null;
  const planFeatures = planWithFeatures?.features ?? {};

  const hasProgramSubscription =
    activePlan !== null ||
    SUBSCRIBED_PLAN_TYPES.has(planTypeCode ?? "standard") ||
    hasProgramPurchase;
  const hasAnyPurchase =
    hasProgramSubscription || hasDiscoveryPurchase || mentorshipSessionCredits > 0;

  // === Reglas de acceso ===
  //
  // Cuando el líder tiene un plan asignado en /administracion/planes
  // (activePlan != null), la configuración del plan es la fuente de
  // verdad ESTRICTA para todos los módulos del programa. Sólo se le
  // suman dos tipos de adquisiciones individuales que son sticky:
  //   - Compra standalone de Descubrimiento (product_group='discovery')
  //     → mantiene canAccessDescubrimiento.
  //   - Créditos vigentes de paquetes de mentoría (product_group=
  //     'mentoring_pack') → mantienen canAccessMentoring1on1.
  // El resto (plan_type legacy 'premium'/'vip'/'empresa_elite', compras
  // sintéticas del grupo 'program') queda IGNORADO cuando hay plan,
  // porque generaban accesos no autorizados por la configuración del
  // plan actual.
  //
  // Cuando no hay plan asignado (legado), seguimos derivando el acceso
  // del plan_type + compras como antes.
  const usingPlanFeatures = activePlan !== null;
  const planEnables = (key: string): boolean =>
    usingPlanFeatures && featureEnabled(planFeatures, key);

  const grantsFromDiscovery = hasDiscoveryPurchase;
  const grantsFromMentoringPack = mentorshipSessionCredits > 0;

  // Grants legacy SÓLO aplican si NO hay plan asignado. Cuando admin
  // asigna un plan, esos grants se desactivan para que el plan sea la
  // fuente de verdad de los módulos del programa.
  const legacySubscriber = SUBSCRIBED_PLAN_TYPES.has(planTypeCode ?? "standard");
  const legacyProgramGrants = usingPlanFeatures
    ? false
    : hasProgramPurchase || legacySubscriber;

  // Recursos free siempre son libres en el modelo histórico para todo
  // líder — no se revocan al asignar un plan minimalista.
  const canAccessAprendizajeRecursosFree = true;
  const canAccessTrayectoria = planEnables("trayectoria") || legacyProgramGrants;
  const canAccessDescubrimiento =
    planEnables("descubrimiento") || legacyProgramGrants || grantsFromDiscovery;
  const canAccessAprendizajeCursos =
    planEnables("aprendizaje_cursos") || legacyProgramGrants;
  const canAccessProgramWorkbooks =
    planEnables("aprendizaje_workbooks") || legacyProgramGrants;
  const canAccessMentoring1on1 =
    planEnables("mentorias_1on1") || legacyProgramGrants || grantsFromMentoringPack;
  const canAccessMentoringGroup =
    planEnables("mentorias_grupales") || legacyProgramGrants;
  const canAccessNetworking = planEnables("networking") || legacyProgramGrants;
  const canAccessMensajes = planEnables("mensajes") || legacyProgramGrants;
  const canAccessConvocatorias = planEnables("convocatorias") || legacyProgramGrants;
  const canAccessWorkshops = planEnables("workshops") || legacyProgramGrants;

  const canAccessProgramMentorships =
    canAccessMentoring1on1 || canAccessMentoringGroup;
  const canAccessLearningLibrary =
    canAccessAprendizajeRecursosFree || canAccessAprendizajeCursos || canAccessProgramWorkbooks;
  const canAccessCommunityModules =
    canAccessNetworking || canAccessConvocatorias || canAccessWorkshops || canAccessMensajes;
  const freeLearningOnly =
    !canAccessProgramWorkbooks &&
    !canAccessAprendizajeCursos &&
    canAccessAprendizajeRecursosFree;

  return {
    viewerTier: hasProgramSubscription ? "subscriber" : "open_leader",
    planTypeCode,
    activePlan,
    planFeatures,
    hasProgramSubscription,
    hasAnyPurchase,
    hasDiscoveryPurchase,
    mentorshipSessionCredits,
    canAccessTrayectoria,
    canAccessDescubrimiento,
    canAccessLearningLibrary,
    canAccessProgramWorkbooks,
    canAccessProgramMentorships,
    canAccessMentoring1on1,
    canAccessMentoringGroup,
    canAccessCommunityModules,
    canAccessNetworking,
    canAccessMensajes,
    canAccessConvocatorias,
    canAccessWorkshops,
    canAccessAprendizajeCursos,
    canAccessAprendizajeRecursosFree,
    freeLearningOnly,
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

/**
 * Tipos seguros: sólo los flags booleanos de ViewerAccessState que
 * representan permisos por feature. Excluimos los booleanos que no son
 * acceso de feature (hasProgramSubscription/hasAnyPurchase, etc.) para
 * evitar usar el helper con la bandera equivocada.
 */
export type AccessFlag =
  | "canAccessTrayectoria"
  | "canAccessDescubrimiento"
  | "canAccessLearningLibrary"
  | "canAccessProgramWorkbooks"
  | "canAccessProgramMentorships"
  | "canAccessMentoring1on1"
  | "canAccessMentoringGroup"
  | "canAccessCommunityModules"
  | "canAccessNetworking"
  | "canAccessMensajes"
  | "canAccessConvocatorias"
  | "canAccessWorkshops"
  | "canAccessAprendizajeCursos"
  | "canAccessAprendizajeRecursosFree";

/**
 * Exige que un líder tenga habilitado un flag específico derivado del plan
 * activo (plan_module_features). Para roles no líderes deja pasar.
 */
export async function requireViewerAccessFlag(
  client: PoolClient,
  actor: AuthUser,
  flag: AccessFlag,
  featureLabel: string,
): Promise<ViewerAccessState> {
  const access = await readAccessStateForActor(client, actor);
  if (actor.role !== "lider") return access;
  if (access[flag] === true) return access;
  throw new ForbiddenError(
    `${featureLabel} no está habilitado en tu plan actual. Pide a tu gestor o advisor ajustar tu plan para acceder.`,
  );
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
