import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { setCohortModuleAccess, type SetCohortAccessInput } from '@/features/cohortes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ cohortId: string }>;
}

export async function PUT(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { cohortId } = await context.params;

  const body = await parseJsonBody<SetCohortAccessInput>(request);
  if (!body?.moduleCode) {
    return NextResponse.json({ ok: false, error: 'Indica el módulo' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await setCohortModuleAccess(client, identity, cohortId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'cohortes',
          action: 'set_cohort_access',
          entityTable: 'app_auth.cohort_module_access',
          entityId: cohortId,
          changeSummary: { moduleCode: body.moduleCode, isEnabled: body.isEnabled },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update cohort access');
  }
}
