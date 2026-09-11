import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  deleteSessionNote,
  updateSessionNote,
  type UpdateSessionNoteInput,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ noteId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateSessionNoteInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const { noteId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateSessionNote(client, identity, noteId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'update_session_note',
          entityTable: 'app_mentoring.session_notes',
          entityId: noteId,
          changeSummary: { hasComment: !!result.comment, hasDocument: !!result.documentUrl },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update session note');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { noteId } = await context.params;
  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteSessionNote(client, identity, noteId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'delete_session_note',
          entityTable: 'app_mentoring.session_notes',
          entityId: result.noteId,
          changeSummary: {},
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data: { noteId } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete session note');
  }
}
