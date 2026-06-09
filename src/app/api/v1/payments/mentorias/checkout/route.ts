import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createCheckoutForOrder } from '@/features/payments/service';
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
        createCheckoutForOrder(client, identity.userId, orderId, provider),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo iniciar el pago.');
  }
}
