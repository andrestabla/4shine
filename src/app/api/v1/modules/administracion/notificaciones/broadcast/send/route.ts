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
  if (!body || !Array.isArray(body.channels) || body.channels.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Falta el campo channels (selecciona al menos email o in-app).' },
      { status: 400 },
    );
  }

  const hasUserIds = Array.isArray(body.recipientUserIds) && body.recipientUserIds.length > 0;
  const hasExternals =
    Array.isArray(body.externalRecipients) && body.externalRecipients.length > 0;
  const hasFilter = body.filter && Object.keys(body.filter).length > 0;
  if (!hasUserIds && !hasExternals && !hasFilter) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'No hay destinatarios. Marca usuarios desde el segmento/búsqueda o agrega emails externos.',
      },
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
