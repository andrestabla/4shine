import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { listPlans } from '@/features/planes/service';
import { listActiveProducts } from '@/features/access/service';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
import type { CommercialProductRecord } from '@/features/access/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Datos públicos para el bloque "Planes y precios (dinámico)" del Site Builder.
 * Devuelve exactamente lo mismo que carga el componente server PricingMatrix:
 * planes activos + catálogo de productos activos (configurados en Admin → Planes).
 */
export async function GET() {
  let plans: SubscriptionPlanWithFeatures[] = [];
  let catalog: CommercialProductRecord[] = [];
  try {
    await withClient(async (client) => {
      plans = await listPlans(client, { includeInactive: false });
      catalog = await listActiveProducts(client);
    });
  } catch {
    plans = [];
    catalog = [];
  }
  return NextResponse.json(
    { ok: true, data: { plans, catalog } },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
