import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  deleteSessionRecording,
  getSessionRecording,
  updateSessionRecording,
  type UpdateSessionRecordingInput,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ recordingId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { recordingId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getSessionRecording(client, identity, recordingId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load session recording');
  }
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { recordingId } = await context.params;

  const body = await parseJsonBody<UpdateSessionRecordingInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateSessionRecording(client, identity, recordingId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'update_session_recording',
          entityTable: 'app_mentoring.session_recordings',
          entityId: recordingId,
          changeSummary: { ...body },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update session recording');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { recordingId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteSessionRecording(client, identity, recordingId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'delete_session_recording',
          entityTable: 'app_mentoring.session_recordings',
          entityId: recordingId,
          changeSummary: {},
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete session recording');
  }
}
