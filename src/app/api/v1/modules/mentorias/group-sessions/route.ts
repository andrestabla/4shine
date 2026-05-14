import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateGroupSessionInput } from '@/features/mentorias/service';
import { createGroupSession } from '@/features/mentorias/service';
import { createZoomMeeting } from '@/server/integrations/zoom';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

function durationMinutes(startsAt: string, endsAt: string): number {
  const diff = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  return Math.max(15, Math.round(diff / 60000));
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateGroupSessionInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // Auto-create Zoom meeting if no URLs were provided manually.
  // Must run inside withRoleContext so RLS policy on integration_configs is satisfied.
  let enrichedBody = body;
  if (!body.zoomJoinUrl && !body.zoomHostUrl) {
    try {
      const meeting = await withClient((client) =>
        withRoleContext(client, identity.userId, identity.role, () =>
          createZoomMeeting(client, identity.userId, {
            topic: body.title,
            startsAt: body.startsAt,
            durationMinutes: durationMinutes(body.startsAt, body.endsAt),
          }),
        ),
      );
      if (meeting) {
        enrichedBody = {
          ...body,
          zoomJoinUrl: meeting.joinUrl,
          zoomHostUrl: meeting.hostUrl,
          zoomMeetingId: meeting.meetingId,
        };
      }
    } catch (zoomError) {
      console.error('[zoom] create meeting failed, session will be created without Zoom URLs:', zoomError);
    }
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createGroupSession(client, identity, enrichedBody);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'create_group_session',
          entityTable: 'app_mentoring.group_session_events',
          entityId: result.eventId,
          changeSummary: {
            startsAt: result.startsAt,
            hostUserId: result.hostUserId,
            zoomMeetingId: result.zoomMeetingId ?? null,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create group session');
  }
}
