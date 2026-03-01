import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { SendMessageInput } from '@/features/mensajes/service';
import { listMessages, sendMessage } from '@/features/mensajes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

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
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await sendMessage(client, identity, {
          threadId,
          messageText: body.messageText,
        });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mensajes',
          action: 'send_message',
          entityTable: 'app_networking.messages',
          entityId: result.messageId,
          changeSummary: { threadId },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to send message');
  }
}
