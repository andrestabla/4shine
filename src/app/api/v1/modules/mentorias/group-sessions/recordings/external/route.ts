import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  createExternalSessionRecording,
  type CreateExternalSessionRecordingInput,
} from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

/**
 * Registra una sesión de Expertos en vivo que ocurrió fuera de la plataforma
 * y publica su grabación. Solo admin y gestor.
 */
export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateExternalSessionRecordingInput>(request);
  if (!body || !body.title?.trim() || !body.recordingUrl?.trim() || !body.recordedAt) {
    return NextResponse.json(
      { ok: false, error: 'Título, URL de grabación y fecha de la sesión son obligatorios' },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createExternalSessionRecording(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'create_external_session_recording',
          entityTable: 'app_mentoring.group_session_recordings',
          entityId: result.recordingId,
          changeSummary: { title: body.title, recordedAt: body.recordedAt },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to create external session recording');
  }
}
