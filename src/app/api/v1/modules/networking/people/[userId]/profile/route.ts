import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getConnectedLeaderProfile } from '@/features/networking/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { userId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getConnectedLeaderProfile(client, identity, userId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'networking',
          action: 'query_connected_leader_profile',
          entityTable: 'app_core.user_profiles',
          entityId: userId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load connected leader profile');
  }
}
