import { NextResponse } from 'next/server';
import { withClient } from '@/server/db/pool';
import { listPlans } from '@/features/planes/service';
import { errorResponse } from '../_utils';

/**
 * Endpoint público para que la página de suscripción del líder
 * (y la página /planes-precios) consuma planes activos.
 * No requiere autenticación; sólo expone planes con is_active = true.
 */
export async function GET() {
  try {
    const data = await withClient((client) => listPlans(client, { includeInactive: false }));
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list public plans');
  }
}
