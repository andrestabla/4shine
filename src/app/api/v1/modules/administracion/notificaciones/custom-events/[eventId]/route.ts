import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  updateCustomEvent,
  deleteCustomEvent,
  type UpdateCustomEventInput,
} from '@/features/notificaciones/custom-events-service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

export async function PATCH(request: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { eventId } = await ctx.params;
  const body = await parseJsonBody<UpdateCustomEventInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Cuerpo inválido' }, { status: 400 });
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const event = await updateCustomEvent(client, identity, eventId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_custom_event',
          entityTable: 'app_admin.notification_events',
          entityId: eventId,
          changeSummary: { eventKey: event.eventKey },
        });
        return event;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo actualizar el evento');
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ eventId: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { eventId } = await ctx.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteCustomEvent(client, identity, eventId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'delete_custom_event',
          entityTable: 'app_admin.notification_events',
          entityId: eventId,
          changeSummary: {},
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudo eliminar el evento');
  }
}
