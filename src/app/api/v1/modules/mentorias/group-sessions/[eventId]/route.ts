import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateGroupSessionInput } from '@/features/mentorias/service';
import { updateGroupSession } from '@/features/mentorias/service';
import { updateZoomMeetingTime } from '@/server/integrations/zoom';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ eventId: string }>;
}

function durationMinutes(startsAt: string, endsAt: string): number {
  const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(15, Math.round(diff / 60000));
}

async function getZoomMeetingIdForEvent(eventId: string): Promise<{ zoomMeetingId: string | null; endsAt: string | null }> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ zoom_meeting_id: string | null; ends_at: string | null }>(
      `SELECT gse.zoom_meeting_id, ms.ends_at::text
       FROM app_mentoring.group_session_events gse
       JOIN app_mentoring.mentorship_sessions ms ON ms.session_id = gse.session_id
       WHERE gse.event_id = $1 LIMIT 1`,
      [eventId],
    );
    return {
      zoomMeetingId: rows[0]?.zoom_meeting_id ?? null,
      endsAt: rows[0]?.ends_at ?? null,
    };
  });
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateGroupSessionInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { eventId } = await context.params;

  // If time is changing, sync the Zoom meeting.
  // Must run inside withRoleContext so RLS policy on integration_configs is satisfied.
  if (body.startsAt) {
    try {
      const { zoomMeetingId, endsAt } = await getZoomMeetingIdForEvent(eventId);
      if (zoomMeetingId) {
        const effectiveEndsAt = body.endsAt ?? endsAt ?? body.startsAt;
        await withClient((client) =>
          withRoleContext(client, identity.userId, identity.role, () =>
            updateZoomMeetingTime(client, identity.userId, zoomMeetingId, {
              startsAt: body.startsAt!,
              durationMinutes: durationMinutes(body.startsAt!, effectiveEndsAt),
            }),
          ),
        );
      }
    } catch (zoomError) {
      console.error('[zoom] update meeting time failed:', zoomError);
    }
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateGroupSession(client, identity, eventId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'update_group_session',
          entityTable: 'app_mentoring.group_session_events',
          entityId: eventId,
          changeSummary: { status: body.status ?? null, startsAt: body.startsAt ?? null },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update group session');
  }
}
