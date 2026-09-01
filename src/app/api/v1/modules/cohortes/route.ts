import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createCohort, listCohorts, type CreateCohortInput } from '@/features/cohortes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () => listCohorts(client, identity)),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list cohorts');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateCohortInput>(request);
  if (!body?.name?.trim()) {
    return NextResponse.json({ ok: false, error: 'El nombre es obligatorio' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createCohort(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'cohortes',
          action: 'create_cohort',
          entityTable: 'app_core.cohorts',
          entityId: result.cohortId,
          changeSummary: { name: result.name, code: result.cohortCode },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to create cohort');
  }
}
