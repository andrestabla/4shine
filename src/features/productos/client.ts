import { requestApi } from '@/lib/api-client';
import type { CreateProductInput, ProductGroup, ProductRecord, UpdateProductInput } from './types';

export type { ProductRecord, CreateProductInput, UpdateProductInput, ProductGroup } from './types';

interface SafeResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function safe<T>(fn: () => Promise<T>): Promise<SafeResponse<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error inesperado' };
  }
}

const BASE = '/api/v1/modules/administracion/productos';

export function listProducts(opts?: { includeInactive?: boolean; groups?: ProductGroup[] }) {
  const params = new URLSearchParams();
  if (opts?.includeInactive) params.set('includeInactive', '1');
  if (opts?.groups && opts.groups.length > 0) params.set('groups', opts.groups.join(','));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return safe(() => requestApi<ProductRecord[]>(`${BASE}${qs}`));
}

export function createProduct(input: CreateProductInput) {
  return safe(() =>
    requestApi<ProductRecord>(`${BASE}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export function updateProduct(productCode: string, input: UpdateProductInput) {
  return safe(() =>
    requestApi<ProductRecord>(`${BASE}/${encodeURIComponent(productCode)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}

export function setProductActive(productCode: string, isActive: boolean) {
  return updateProduct(productCode, { isActive });
}

export function deleteProduct(productCode: string) {
  return safe(() =>
    requestApi<{ deleted: true }>(`${BASE}/${encodeURIComponent(productCode)}`, { method: 'DELETE' }),
  );
}
