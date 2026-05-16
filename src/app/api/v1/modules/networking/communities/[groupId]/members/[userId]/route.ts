import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { updateMemberRole } from '@/features/networking/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../../../_utils';

interface ContextParams { params: Promise<{ groupId: string; userId: string }> }

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const body = await parseJsonBody<{ role: 'moderator' | 'member' }>(request);
  if (!body || !['moderator', 'member'].includes(body.role)) {
    return NextResponse.json({ ok: false, error: 'role must be moderator or member' }, { status: 400 });
  }
  const { groupId, userId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        updateMemberRole(client, identity, groupId, userId, body.role)
      )
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update member role');
  }
}
