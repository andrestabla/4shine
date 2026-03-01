import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateMentorshipInput } from '@/features/mentorias/service';
import { deleteMentorship, updateMentorship } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface ContextParams {
  params: Promise<{ sessionId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateMentorshipInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateMentorship(client, identity, sessionId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'update_mentorship',
          entityTable: 'app_mentoring.mentorship_sessions',
          entityId: sessionId,
          changeSummary: { status: result.status },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update mentorship session');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { sessionId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteMentorship(client, sessionId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'delete_mentorship',
          entityTable: 'app_mentoring.mentorship_sessions',
          entityId: sessionId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete mentorship session');
  }
}
