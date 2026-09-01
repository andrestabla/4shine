import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getGroupSessionRecording } from '@/features/mentorias/service';
import { errorResponse, unauthorizedResponse } from '../../../../_utils';

/** Detalle de una grabación para la página interna de reproducción. */
export async function GET(
  request: Request,
  context: { params: Promise<{ recordingId: string }> },
) {
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
