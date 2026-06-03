import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { sendBulkMessage } from '@/features/notificaciones/bulk-service';
import type { BulkSendInput } from '@/features/notificaciones/types';
import {
  errorResponse,
  parseJsonBody,
  unauthorizedResponse,
} from '../../../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<BulkSendInput>(request);
  if (!body || !body.filter || !body.channels) {
    return NextResponse.json(
      { ok: false, error: 'Faltan parámetros (filter, channels).' },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        sendBulkMessage(client, identity, body),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo enviar el mensaje masivo.');
  }
}
