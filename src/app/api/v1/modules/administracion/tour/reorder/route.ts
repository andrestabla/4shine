import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { reorderSteps } from '@/features/tour/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ orderedStepIds: string[] }>(request);
  if (!body || !Array.isArray(body.orderedStepIds)) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await reorderSteps(client, identity, body.orderedStepIds);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'reorder_tour_steps',
          entityTable: 'app_admin.tour_steps',
          changeSummary: { count: body.orderedStepIds.length },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to reorder tour steps');
  }
}
