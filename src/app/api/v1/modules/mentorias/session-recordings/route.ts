import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  createSessionRecording,
  listSessionRecordingsForLeader,
  type CreateSessionRecordingInput,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

/** Grabaciones 1:1 de un líder (?leaderUserId=). */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const leaderUserId =
    new URL(request.url).searchParams.get('leaderUserId')?.trim() || identity.userId;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listSessionRecordingsForLeader(client, identity, leaderUserId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list session recordings');
  }
}

/** Carga manual de una grabación 1:1 (solo gestor o admin). */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateSessionRecordingInput>(request);
  if (!body?.sessionId || !body.title?.trim() || !body.recordingUrl?.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Sesión, título y URL de grabación son obligatorios' },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createSessionRecording(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'create_session_recording',
          entityTable: 'app_mentoring.session_recordings',
          entityId: result.recordingId,
          changeSummary: { sessionId: body.sessionId, title: body.title },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to create session recording');
  }
}
