import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  listCustomEvents,
  createCustomEvent,
  type CreateCustomEventInput,
} from '@/features/notificaciones/custom-events-service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listCustomEvents(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudieron cargar los eventos personalizados');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const body = await parseJsonBody<CreateCustomEventInput>(request);
  if (!body?.label || !body?.moduleCode || !body?.triggerType) {
    return NextResponse.json({ ok: false, error: 'Datos incompletos del evento' }, { status: 400 });
  }
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const event = await createCustomEvent(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'create_custom_event',
          entityTable: 'app_admin.notification_events',
          entityId: event.eventId,
          changeSummary: { eventKey: event.eventKey, triggerType: event.triggerType },
        });
        return event;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'No se pudo crear el evento');
  }
}
