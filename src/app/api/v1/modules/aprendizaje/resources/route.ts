import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listLearningResources } from '@/features/aprendizaje/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listLearningResources(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'query_learning_resources',
          entityTable: 'app_learning.content_items',
          changeSummary: { total: result.length },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list learning resources');
  }
}
