import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getWorkshop } from '@/features/workshops/service';
import { createDirectThread, sendMessage } from '@/features/mensajes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ workshopId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ message: string }>(request);
  if (!body?.message?.trim()) {
    return NextResponse.json({ ok: false, error: 'message is required' }, { status: 400 });
  }

  const { workshopId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const workshop = await getWorkshop(client, identity, workshopId);

        const recipientId = workshop.facilitatorUserId ?? workshop.createdBy;
        if (!recipientId || recipientId === identity.userId) {
          throw new Error('No hay un contacto disponible para esta consulta');
        }

        const thread = await createDirectThread(client, identity, {
          participantUserId: recipientId,
        });

        await sendMessage(client, identity, {
          threadId: thread.threadId,
          messageText: `Consulta sobre "${workshop.title}":\n\n${body.message.trim()}`,
        });

        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'send_inquiry',
          entityTable: 'app_networking.workshops',
          entityId: workshopId,
        });

        return { threadId: thread.threadId };
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to send inquiry');
  }
}
