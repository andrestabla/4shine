import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getContentCohorts, setContentCohorts } from '@/features/cohortes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ contentId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { contentId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getContentCohorts(client, identity, contentId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load content cohorts');
  }
}

export async function PUT(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { contentId } = await context.params;

  const body = await parseJsonBody<{ cohortIds: string[] }>(request);
  if (!body || !Array.isArray(body.cohortIds)) {
    return NextResponse.json({ ok: false, error: 'cohortIds es obligatorio' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await setContentCohorts(client, identity, contentId, body.cohortIds);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'cohortes',
          action: 'set_content_cohorts',
          entityTable: 'app_learning.content_cohorts',
          entityId: contentId,
          changeSummary: { cohortIds: body.cohortIds },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to set content cohorts');
  }
}
