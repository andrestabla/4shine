import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateMentorshipInput } from '@/features/mentorias/service';
import { deleteMentorship, updateMentorship } from '@/features/mentorias/service';
import { deleteZoomMeeting } from '@/server/integrations/zoom';
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
  const isCancellation = body.status === 'cancelled';

  // Grab zoom_meeting_id before the update (it gets used after the session is cancelled)
  let zoomMeetingId: string | null = null;
  if (isCancellation) {
    zoomMeetingId = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const { rows } = await client.query<{ zoom_meeting_id: string | null }>(
          `SELECT zoom_meeting_id FROM app_mentoring.mentorship_sessions WHERE session_id = $1::uuid LIMIT 1`,
          [sessionId],
        );
        return rows[0]?.zoom_meeting_id ?? null;
      }),
    );
  }

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

    if (isCancellation) {
      // Delete Zoom meeting (fire-and-forget)
      if (zoomMeetingId) {
        withClient((c) =>
          withRoleContext(c, identity.userId, identity.role, () =>
            deleteZoomMeeting(c, identity.userId, zoomMeetingId!),
          ),
        ).catch((err) => console.error('[zoom] delete meeting failed:', err));
      }

      // Notificación de cancelación (email + in-app) se dispara dentro de
      // updateMentorship vía el engine (mentorias.session_cancelled_mentee).
      // No emails hardcoded para evitar duplicados.
    }

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
