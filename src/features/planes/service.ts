import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import { isValidFeatureKey } from './features-catalog';
import type {
  CreatePlanInput,
  PlanFeatureInput,
  PlanFeatureKey,
  PlanFeatureRecord,
  PlanGroup,
  SubscriptionPlanRecord,
  SubscriptionPlanWithFeatures,
  UpdatePlanInput,
} from './types';

// ─── Internal row types ───────────────────────────────────────────────────────

interface PlanRow {
  plan_id: string;
  plan_code: string;
  plan_group: PlanGroup;
  name: string;
  description: string;
  highlight_label: string | null;
  price_amount: string | number;
  currency_code: string;
  duration_days: number;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FeatureRow {
  plan_id: string;
  feature_key: string;
  is_enabled: boolean;
  quota: number | null;
}

const PLAN_SELECT = `
  plan_id::text, plan_code, plan_group, name, description, highlight_label,
  price_amount, currency_code, duration_days, is_active, is_system, sort_order,
  created_at::text, updated_at::text
`;

function toPlanRecord(row: PlanRow): SubscriptionPlanRecord {
  return {
    planId: row.plan_id,
    planCode: row.plan_code,
    planGroup: row.plan_group,
    name: row.name,
    description: row.description,
    highlightLabel: row.highlight_label,
    priceAmount: Number(row.price_amount ?? 0),
    currencyCode: row.currency_code,
    durationDays: Number(row.duration_days ?? 0),
    isActive: row.is_active,
    isSystem: row.is_system,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toFeatureRecord(row: FeatureRow): PlanFeatureRecord {
  return {
    planId: row.plan_id,
    featureKey: row.feature_key as PlanFeatureKey,
    isEnabled: row.is_enabled,
    quota: row.quota,
  };
}

async function loadFeaturesForPlans(
  client: PoolClient,
  planIds: string[],
): Promise<Map<string, PlanFeatureRecord[]>> {
  const result = new Map<string, PlanFeatureRecord[]>();
  if (planIds.length === 0) return result;

  const { rows } = await client.query<FeatureRow>(
    `SELECT plan_id::text, feature_key, is_enabled, quota
     FROM app_billing.plan_module_features
     WHERE plan_id = ANY($1::uuid[])`,
    [planIds],
  );

  for (const row of rows) {
    const list = result.get(row.plan_id) ?? [];
    list.push(toFeatureRecord(row));
    result.set(row.plan_id, list);
  }
  return result;
}

function validateFeatureInputs(features: PlanFeatureInput[]): void {
  for (const f of features) {
    if (!isValidFeatureKey(f.featureKey)) {
      throw new Error(`Feature key inválido: ${f.featureKey}`);
    }
    if (f.quota !== null && f.quota !== undefined && f.quota < 0) {
      throw new Error(`Quota inválido para ${f.featureKey}`);
    }
  }
}

async function upsertFeatures(
  client: PoolClient,
  planId: string,
  features: PlanFeatureInput[],
): Promise<void> {
  if (features.length === 0) return;
  validateFeatureInputs(features);

  for (const f of features) {
    await client.query(
      `INSERT INTO app_billing.plan_module_features (plan_id, feature_key, is_enabled, quota)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (plan_id, feature_key) DO UPDATE SET
         is_enabled = EXCLUDED.is_enabled,
         quota      = EXCLUDED.quota,
         updated_at = now()`,
      [planId, f.featureKey, f.isEnabled, f.quota ?? null],
    );
  }
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function listPlans(
  client: PoolClient,
  options?: { includeInactive?: boolean },
): Promise<SubscriptionPlanWithFeatures[]> {
  const includeInactive = options?.includeInactive ?? false;
  const { rows } = await client.query<PlanRow>(
    `SELECT ${PLAN_SELECT}
     FROM app_billing.subscription_plans
     ${includeInactive ? '' : 'WHERE is_active = true'}
     ORDER BY sort_order, name`,
  );
  const plans = rows.map(toPlanRecord);
  const features = await loadFeaturesForPlans(client, plans.map((p) => p.planId));
  return plans.map((plan) => ({
    ...plan,
    features: features.get(plan.planId) ?? [],
  }));
}

export async function getPlanById(
  client: PoolClient,
  planId: string,
): Promise<SubscriptionPlanWithFeatures | null> {
  const { rows } = await client.query<PlanRow>(
    `SELECT ${PLAN_SELECT}
     FROM app_billing.subscription_plans
     WHERE plan_id = $1
     LIMIT 1`,
    [planId],
  );
  if (!rows[0]) return null;
  const plan = toPlanRecord(rows[0]);
  const features = await loadFeaturesForPlans(client, [plan.planId]);
  return { ...plan, features: features.get(plan.planId) ?? [] };
}

export async function getPlanByCode(
  client: PoolClient,
  planCode: string,
): Promise<SubscriptionPlanWithFeatures | null> {
  const { rows } = await client.query<PlanRow>(
    `SELECT ${PLAN_SELECT}
     FROM app_billing.subscription_plans
     WHERE plan_code = $1
     LIMIT 1`,
    [planCode],
  );
  if (!rows[0]) return null;
  const plan = toPlanRecord(rows[0]);
  const features = await loadFeaturesForPlans(client, [plan.planId]);
  return { ...plan, features: features.get(plan.planId) ?? [] };
}

// ─── Write (admin/gestor only) ───────────────────────────────────────────────

export async function createPlan(
  client: PoolClient,
  actor: AuthUser,
  input: CreatePlanInput,
): Promise<SubscriptionPlanWithFeatures> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const code = input.planCode.trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(code) || code.length < 2 || code.length > 60) {
    throw new Error('plan_code inválido (snake_case, 2-60 chars).');
  }
  if (input.priceAmount < 0) throw new Error('Precio inválido.');
  if (input.durationDays <= 0) throw new Error('Duración debe ser > 0 días.');

  const { rows } = await client.query<PlanRow>(
    `INSERT INTO app_billing.subscription_plans
       (plan_code, plan_group, name, description, highlight_label,
        price_amount, currency_code, duration_days, is_active,
        sort_order, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING ${PLAN_SELECT}`,
    [
      code,
      input.planGroup ?? 'custom',
      input.name.trim(),
      input.description?.trim() ?? '',
      input.highlightLabel?.trim() || null,
      input.priceAmount,
      input.currencyCode ?? 'USD',
      input.durationDays,
      input.isActive ?? true,
      input.sortOrder ?? 100,
      actor.userId,
    ],
  );

  const plan = toPlanRecord(rows[0]);
  if (input.features && input.features.length > 0) {
    await upsertFeatures(client, plan.planId, input.features);
  }

  const result = await getPlanById(client, plan.planId);
  if (!result) throw new Error('No se pudo leer el plan recién creado.');
  return result;
}

export async function updatePlan(
  client: PoolClient,
  actor: AuthUser,
  planId: string,
  input: UpdatePlanInput,
): Promise<SubscriptionPlanWithFeatures> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const { rows: existing } = await client.query<{ is_system: boolean }>(
    `SELECT is_system FROM app_billing.subscription_plans WHERE plan_id = $1 LIMIT 1`,
    [planId],
  );
  if (!existing[0]) throw new Error('Plan no encontrado.');

  const setClauses: string[] = [];
  const params: unknown[] = [planId];
  let idx = 2;

  const fields: Array<[string, unknown]> = [
    ['plan_group', input.planGroup],
    ['name', input.name?.trim()],
    ['description', input.description?.trim()],
    ['highlight_label', input.highlightLabel === undefined
      ? undefined
      : (input.highlightLabel?.trim() || null)],
    ['price_amount', input.priceAmount],
    ['currency_code', input.currencyCode],
    ['duration_days', input.durationDays],
    ['is_active', input.isActive],
    ['sort_order', input.sortOrder],
  ];

  for (const [col, val] of fields) {
    if (val !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(val);
    }
  }

  if (setClauses.length > 0) {
    await client.query(
      `UPDATE app_billing.subscription_plans
       SET ${setClauses.join(', ')}
       WHERE plan_id = $1`,
      params,
    );
  }

  if (input.features && input.features.length > 0) {
    await upsertFeatures(client, planId, input.features);
  }

  void actor;
  const result = await getPlanById(client, planId);
  if (!result) throw new Error('No se pudo leer el plan actualizado.');
  return result;
}

export async function setPlanActive(
  client: PoolClient,
  actor: AuthUser,
  planId: string,
  isActive: boolean,
): Promise<SubscriptionPlanWithFeatures> {
  return updatePlan(client, actor, planId, { isActive });
}

export async function deletePlan(
  client: PoolClient,
  actor: AuthUser,
  planId: string,
): Promise<void> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const { rows } = await client.query<{ is_system: boolean }>(
    `SELECT is_system FROM app_billing.subscription_plans WHERE plan_id = $1 LIMIT 1`,
    [planId],
  );
  if (!rows[0]) throw new Error('Plan no encontrado.');
  if (rows[0].is_system) {
    throw new Error('No se puede eliminar un plan del sistema. Desactívalo en su lugar.');
  }

  const { rows: usage } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM app_core.user_profiles
     WHERE subscription_plan_id = $1`,
    [planId],
  );
  if (Number(usage[0]?.count ?? 0) > 0) {
    throw new Error('No se puede eliminar: hay usuarios suscritos. Desactiva el plan.');
  }

  await client.query(
    `DELETE FROM app_billing.subscription_plans WHERE plan_id = $1`,
    [planId],
  );
  void actor;
}
