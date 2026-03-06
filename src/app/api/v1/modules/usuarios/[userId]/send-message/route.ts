import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { sendUserDirectMessage } from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ userId: string }>;
}

interface SendMessageBody {
  messageText?: string;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<SendMessageBody>(request);
  const messageText = body?.messageText?.trim();
  if (!messageText) {
    return NextResponse.json({ ok: false, error: 'messageText is required' }, { status: 400 });
  }

  const { userId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await sendUserDirectMessage(client, identity, userId, messageText);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'send_user_direct_message',
          entityTable: 'app_networking.messages',
          entityId: result.messageId,
          changeSummary: {
            threadId: result.threadId,
            recipientUserId: userId,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to send direct message');
  }
}
