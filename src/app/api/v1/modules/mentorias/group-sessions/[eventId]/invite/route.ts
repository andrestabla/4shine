import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { inviteGroupSessionByRoles } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ eventId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ roleCodes?: Array<'lider' | 'mentor' | 'gestor' | 'admin'> }>(request);
  if (!body?.roleCodes || body.roleCodes.length === 0) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { eventId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await inviteGroupSessionByRoles(client, identity, { eventId, roleCodes: body.roleCodes ?? [] });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'invite_group_session_roles',
          entityTable: 'app_mentoring.group_session_events',
          entityId: eventId,
          changeSummary: { roleCodes: body.roleCodes, invitedCount: result.invitedCount },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to invite group session by roles');
  }
}
