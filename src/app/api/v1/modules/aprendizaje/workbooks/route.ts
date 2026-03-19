import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listWorkbooks } from '@/features/aprendizaje/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const ownerUserId = url.searchParams.get('ownerUserId') ?? undefined;

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listWorkbooks(client, identity, { ownerUserId });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'query_workbooks',
          entityTable: 'app_learning.user_workbooks',
          changeSummary: { ownerUserId: ownerUserId ?? 'all', total: result.length },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list workbooks');
  }
}
