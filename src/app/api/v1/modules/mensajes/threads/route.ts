import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateDirectThreadInput } from '@/features/mensajes/service';
import { createDirectThread, listThreads } from '@/features/mensajes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 100);

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listThreads(client, identity, limit);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mensajes',
          action: 'query_threads',
          entityTable: 'app_networking.chat_threads',
          changeSummary: { limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list threads');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateDirectThreadInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createDirectThread(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mensajes',
          action: 'create_direct_thread',
          entityTable: 'app_networking.chat_threads',
          entityId: result.threadId,
          changeSummary: { participantUserId: body.participantUserId },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create thread');
  }
}
