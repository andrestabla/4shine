import type { PoolClient } from 'pg';
import { requireModulePermission } from '@/server/auth/module-permissions';
import type { AuthUser } from '@/server/auth/types';
import type {
  CreateProductInput,
  ProductGroup,
  ProductRecord,
  UpdateProductInput,
} from './types';

interface ProductRow {
  product_code: string;
  product_group: ProductGroup;
  name: string;
  headline: string;
  description: string;
  price_amount: string | number;
  currency_code: string;
  sessions_included: number | null;
  highlight_label: string | null;
  is_active: boolean;
  is_system: boolean;
  sort_order: number;
  checkout_url: string | null;
  checkout_type: string | null;
  cta_label: string | null;
  created_at: string;
  updated_at: string;
}

const PRODUCT_SELECT = `
  product_code, product_group, name, headline, description,
  price_amount, currency_code, sessions_included, highlight_label,
  is_active, is_system, sort_order, checkout_url, checkout_type, cta_label,
  created_at::text, updated_at::text
`;

function toRecord(row: ProductRow): ProductRecord {
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
    isActive: row.is_active,
    isSystem: row.is_system,
    sortOrder: Number(row.sort_order ?? 0),
    checkoutUrl: row.checkout_url ?? null,
    checkoutType: row.checkout_type === 'whatsapp' ? 'whatsapp' : 'payment',
    ctaLabel: row.cta_label ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(
  client: PoolClient,
  options?: { includeInactive?: boolean; groups?: ProductGroup[] },
): Promise<ProductRecord[]> {
  const includeInactive = options?.includeInactive ?? false;
  const groups = options?.groups;

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (!includeInactive) conditions.push('is_active = true');
  if (groups && groups.length > 0) {
    params.push(groups);
    conditions.push(`product_group = ANY($${params.length}::text[])`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await client.query<ProductRow>(
    `SELECT ${PRODUCT_SELECT}
     FROM app_billing.product_catalog
     ${where}
     ORDER BY sort_order, name`,
    params,
  );
  return rows.map(toRecord);
}

export async function getProductByCode(
  client: PoolClient,
  productCode: string,
): Promise<ProductRecord | null> {
  const { rows } = await client.query<ProductRow>(
    `SELECT ${PRODUCT_SELECT}
     FROM app_billing.product_catalog
     WHERE product_code = $1
     LIMIT 1`,
    [productCode],
  );
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function createProduct(
  client: PoolClient,
  actor: AuthUser,
  input: CreateProductInput,
): Promise<ProductRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const code = input.productCode.trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(code) || code.length < 2 || code.length > 60) {
    throw new Error('product_code inválido (snake_case, 2-60 chars).');
  }
  if (input.priceAmount < 0) throw new Error('Precio inválido.');

  const { rows } = await client.query<ProductRow>(
    `INSERT INTO app_billing.product_catalog
       (product_code, product_group, name, headline, description,
        price_amount, currency_code, sessions_included, highlight_label,
        is_active, sort_order, checkout_url, checkout_type, cta_label)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING ${PRODUCT_SELECT}`,
    [
      code,
      input.productGroup,
      input.name.trim(),
      input.headline?.trim() ?? '',
      input.description?.trim() ?? '',
      input.priceAmount,
      input.currencyCode ?? 'USD',
      input.sessionsIncluded ?? 0,
      input.highlightLabel?.trim() || null,
      input.isActive ?? true,
      input.sortOrder ?? 100,
      input.checkoutUrl?.trim() || null,
      input.checkoutType === 'whatsapp' ? 'whatsapp' : 'payment',
      input.ctaLabel?.trim() || null,
    ],
  );
  void actor;
  return toRecord(rows[0]);
}

export async function updateProduct(
  client: PoolClient,
  actor: AuthUser,
  productCode: string,
  input: UpdateProductInput,
): Promise<ProductRecord> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const { rows: existing } = await client.query<{ is_system: boolean }>(
    `SELECT is_system FROM app_billing.product_catalog WHERE product_code = $1 LIMIT 1`,
    [productCode],
  );
  if (!existing[0]) throw new Error('Producto no encontrado.');

  const setClauses: string[] = ['updated_at = now()'];
  const params: unknown[] = [productCode];
  let idx = 2;

  const fields: Array<[string, unknown]> = [
    ['product_group', input.productGroup],
    ['name', input.name?.trim()],
    ['headline', input.headline?.trim()],
    ['description', input.description?.trim()],
    ['price_amount', input.priceAmount],
    ['currency_code', input.currencyCode],
    ['sessions_included', input.sessionsIncluded],
    ['highlight_label',
      input.highlightLabel === undefined ? undefined : (input.highlightLabel?.trim() || null)],
    ['is_active', input.isActive],
    ['sort_order', input.sortOrder],
    ['checkout_url',
      input.checkoutUrl === undefined ? undefined : (input.checkoutUrl?.trim() || null)],
    ['checkout_type',
      input.checkoutType === undefined ? undefined : (input.checkoutType === 'whatsapp' ? 'whatsapp' : 'payment')],
    ['cta_label',
      input.ctaLabel === undefined ? undefined : (input.ctaLabel?.trim() || null)],
  ];

  for (const [col, val] of fields) {
    if (val !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      params.push(val);
    }
  }

  const { rows } = await client.query<ProductRow>(
    `UPDATE app_billing.product_catalog
     SET ${setClauses.join(', ')}
     WHERE product_code = $1
     RETURNING ${PRODUCT_SELECT}`,
    params,
  );
  void actor;
  return toRecord(rows[0]);
}

export async function setProductActive(
  client: PoolClient,
  actor: AuthUser,
  productCode: string,
  isActive: boolean,
): Promise<ProductRecord> {
  return updateProduct(client, actor, productCode, { isActive });
}

export async function deleteProduct(
  client: PoolClient,
  actor: AuthUser,
  productCode: string,
): Promise<void> {
  await requireModulePermission(client, 'usuarios', 'manage');

  const { rows } = await client.query<{ is_system: boolean }>(
    `SELECT is_system FROM app_billing.product_catalog WHERE product_code = $1 LIMIT 1`,
    [productCode],
  );
  if (!rows[0]) throw new Error('Producto no encontrado.');
  if (rows[0].is_system) {
    throw new Error('No se puede eliminar un producto del sistema. Desactívalo en su lugar.');
  }

  const { rows: usage } = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count
     FROM app_billing.user_purchases
     WHERE product_code = $1`,
    [productCode],
  );
  if (Number(usage[0]?.count ?? 0) > 0) {
    throw new Error('No se puede eliminar: hay compras registradas. Desactiva el producto.');
  }

  await client.query(
    `DELETE FROM app_billing.product_catalog WHERE product_code = $1`,
    [productCode],
  );
  void actor;
}
