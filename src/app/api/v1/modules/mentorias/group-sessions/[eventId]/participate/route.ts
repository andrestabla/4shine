import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { ParticipateGroupSessionInput } from '@/features/mentorias/service';
import { participateInGroupSession } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<ParticipateGroupSessionInput>(request);
  if (!body || !body.status) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { eventId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await participateInGroupSession(client, identity, eventId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'participate_group_session',
          entityTable: 'app_mentoring.group_session_participation',
          entityId: eventId,
          changeSummary: { status: body.status },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to participate in group session');
  }
}
