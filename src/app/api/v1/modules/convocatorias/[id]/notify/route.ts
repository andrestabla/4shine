import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { notifyInterestedUsers } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await notifyInterestedUsers(client, identity, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'notify_interested_users',
          entityTable: 'app_networking.convocatorias',
          entityId: id,
          changeSummary: { notified: result.notified },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to notify interested users');
  }
}
