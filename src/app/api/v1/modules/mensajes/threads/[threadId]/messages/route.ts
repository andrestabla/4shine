import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { SendMessageInput } from '@/features/mensajes/service';
import { listMessages, sendMessage } from '@/features/mensajes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';
import { getPusherServer } from '@/lib/pusher-server';

interface ContextParams {
  params: Promise<{ threadId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { threadId } = await context.params;

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 100);

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listMessages(client, identity, threadId, limit);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mensajes',
          action: 'query_messages',
          entityTable: 'app_networking.messages',
          entityId: threadId,
          changeSummary: { threadId, limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list messages');
  }
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<Omit<SendMessageInput, 'threadId'>>(request);
  if (!body || !body.messageText) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { threadId } = await context.params;

  try {
    const { message, participantIds } = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const message = await sendMessage(client, identity, {
          threadId,
          messageText: body.messageText,
        });

        const { rows } = await client.query<{ user_id: string }>(
          `SELECT user_id::text FROM app_networking.thread_participants WHERE thread_id = $1`,
          [threadId],
        );

        await logModuleAudit(client, request, identity, {
          moduleCode: 'mensajes',
          action: 'send_message',
          entityTable: 'app_networking.messages',
          entityId: message.messageId,
          changeSummary: { threadId },
        });

        return { message, participantIds: rows.map((r) => r.user_id) };
      }),
    );

    // Fire Pusher events — non-blocking
    if (process.env.PUSHER_APP_ID) {
      const pusher = getPusherServer();
      void pusher.trigger(`private-thread-${threadId}`, 'new-message', message).catch(() => {});
      if (participantIds.length > 0) {
        void pusher
          .triggerBatch(
            participantIds.map((uid) => ({
              channel: `private-user-${uid}`,
              name: 'thread-updated',
              data: { threadId },
            })),
          )
          .catch(() => {});
      }
    }

    return NextResponse.json({ ok: true, data: message }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to send message');
  }
}
