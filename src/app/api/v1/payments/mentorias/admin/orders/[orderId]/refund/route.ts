import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { refundOrder } from '@/features/payments/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../../../../modules/_utils';

export const runtime = 'nodejs';

interface RefundBody {
  reason?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ ok: false, error: 'orderId requerido.' }, { status: 400 });
  }
  const body = await parseJsonBody<RefundBody>(request);
  const reason = (body?.reason ?? '').trim();
  if (!reason) {
    return NextResponse.json(
      { ok: false, error: 'Motivo del reembolso es obligatorio.' },
      { status: 400 },
    );
  }
  if (reason.length > 500) {
    return NextResponse.json(
      { ok: false, error: 'Motivo demasiado largo (máx. 500).' },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, 'usuarios', 'manage');
        return refundOrder(client, identity.userId, orderId, reason);
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo procesar el reembolso.');
  }
}
