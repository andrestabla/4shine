// POST /api/v1/payments/workshops/checkout
//
// Inicia el flujo de pago de un workshop: dado un orderId (creado vía
// POST /api/v1/modules/workshops/[id]/orders) y un provider (stripe|wompi),
// devuelve la URL a la que redirigir al usuario.
//
// Espejo exacto de /api/v1/payments/mentorias/checkout — solo cambia el
// service llamado.

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createWorkshopCheckoutForOrder } from '@/features/payments/service';
import type { PaymentProviderKey } from '@/features/payments/types';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../modules/_utils';

export const runtime = 'nodejs';

interface CheckoutBody {
  orderId?: string;
  provider?: PaymentProviderKey;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CheckoutBody>(request);
  const orderId = body?.orderId?.trim();
  const provider = body?.provider;

  if (!orderId || !provider) {
    return NextResponse.json(
      { ok: false, error: 'orderId y provider son obligatorios.' },
      { status: 400 },
    );
  }
  if (provider !== 'stripe' && provider !== 'wompi') {
    return NextResponse.json({ ok: false, error: 'Proveedor inválido.' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        createWorkshopCheckoutForOrder(client, identity.userId, orderId, provider),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo iniciar el pago del workshop.');
  }
}
