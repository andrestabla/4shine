import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  deleteCohort,
  getCohortDetail,
  updateCohort,
  type UpdateCohortInput,
} from '@/features/cohortes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface ContextParams {
  params: Promise<{ cohortId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { cohortId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getCohortDetail(client, identity, cohortId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load cohort');
  }
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { cohortId } = await context.params;

  const body = await parseJsonBody<UpdateCohortInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateCohort(client, identity, cohortId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'cohortes',
          action: 'update_cohort',
          entityTable: 'app_core.cohorts',
          entityId: cohortId,
          changeSummary: { ...body },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update cohort');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { cohortId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteCohort(client, identity, cohortId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'cohortes',
          action: 'delete_cohort',
          entityTable: 'app_core.cohorts',
          entityId: cohortId,
          changeSummary: {},
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete cohort');
  }
}
