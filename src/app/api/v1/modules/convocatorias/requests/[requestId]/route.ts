import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { ReviewRequestInput } from '@/features/convocatorias/service';
import { reviewRequest } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ requestId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<ReviewRequestInput>(request);
  if (!body?.status) return NextResponse.json({ ok: false, error: 'status is required' }, { status: 400 });

  const { requestId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await reviewRequest(client, identity, requestId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'review_convocatoria_request',
          entityTable: 'app_networking.convocatoria_requests',
          entityId: requestId,
          changeSummary: { status: result.status },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to review request');
  }
}
