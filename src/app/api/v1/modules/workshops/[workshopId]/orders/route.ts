// POST /api/v1/modules/workshops/[workshopId]/orders
//
// Crea una orden de compra para un workshop. Si el usuario ya tiene una
// orden pending_payment para el mismo workshop, devuelve esa (idempotente).
//
// La UI luego llama a /api/v1/payments/workshops/checkout con el orderId
// para iniciar el flujo de Stripe o Wompi.

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createWorkshopOrder } from '@/features/workshops/orders-service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ workshopId: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workshopId } = await context.params;
  if (!workshopId) {
    return NextResponse.json(
      { ok: false, error: 'workshopId requerido.' },
      { status: 400 },
    );
  }

  try {
    const result = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const created = await createWorkshopOrder(client, identity, workshopId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: created.reused ? 'reuse_order' : 'create_order',
          entityTable: 'app_networking.workshop_orders',
          entityId: created.order.orderId,
          changeSummary: {
            workshopId,
            priceAmount: created.order.priceAmount,
            currencyCode: created.order.currencyCode,
          },
        });
        return created;
      }),
    );
    return NextResponse.json({ ok: true, data: result }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, 'No se pudo crear la orden de workshop.');
  }
}
