import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { GroupSessionReaction } from '@/features/mentorias/service';
import { reactToGroupSessionRecording } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../../_utils';

interface ContextParams {
  params: Promise<{ recordingId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ reaction?: GroupSessionReaction }>(request);
  if (!body?.reaction) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { recordingId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await reactToGroupSessionRecording(client, identity, recordingId, body.reaction as GroupSessionReaction);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'react_group_recording',
          entityTable: 'app_mentoring.group_session_recording_reactions',
          entityId: recordingId,
          changeSummary: { reaction: body.reaction },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to react to recording');
  }
}
