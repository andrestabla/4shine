import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  createSessionNote,
  listSessionNotesForLeader,
  type CreateSessionNoteInput,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

/** Notas de mentoría de un líder (?leaderUserId=; por defecto, el propio). */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const leaderUserId =
    new URL(request.url).searchParams.get('leaderUserId')?.trim() || identity.userId;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listSessionNotesForLeader(client, identity, leaderUserId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list session notes');
  }
}

/** Nueva nota (advisor de la sesión, gestor o admin). */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateSessionNoteInput>(request);
  if (!body?.sessionId || !body.noteDate) {
    return NextResponse.json({ ok: false, error: 'Sesión y fecha son obligatorias' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createSessionNote(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'create_session_note',
          entityTable: 'app_mentoring.session_notes',
          entityId: result.noteId,
          changeSummary: { sessionId: body.sessionId, hasComment: !!result.comment, hasDocument: !!result.documentUrl },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create session note');
  }
}
