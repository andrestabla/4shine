import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateGroupSessionRecordingInput } from '@/features/mentorias/service';
import {
  deleteGroupSessionRecording,
  getGroupSessionRecording,
  updateGroupSessionRecording,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ recordingId: string }>;
}

/** Detalle de una grabación para la página interna de reproducción. */
export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { recordingId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getGroupSessionRecording(client, identity, recordingId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load recording');
  }
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateGroupSessionRecordingInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { recordingId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateGroupSessionRecording(client, identity, recordingId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'update_group_recording',
          entityTable: 'app_mentoring.group_session_recordings',
          entityId: recordingId,
          changeSummary: { title: body.title ?? null },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update group session recording');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { recordingId } = await context.params;

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteGroupSessionRecording(client, identity, recordingId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'delete_group_recording',
          entityTable: 'app_mentoring.group_session_recordings',
          entityId: recordingId,
          changeSummary: {},
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete group session recording');
  }
}
