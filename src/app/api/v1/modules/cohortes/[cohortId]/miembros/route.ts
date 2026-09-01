import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  addCohortMembers,
  removeCohortMembers,
  type CohortMembershipInput,
} from '@/features/cohortes/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ cohortId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { cohortId } = await context.params;

  const body = await parseJsonBody<CohortMembershipInput>(request);
  if (!body || !Array.isArray(body.userIds) || body.userIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'Selecciona al menos una persona' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await addCohortMembers(client, identity, cohortId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'cohortes',
          action: 'add_cohort_members',
          entityTable: 'app_core.cohort_memberships',
          entityId: cohortId,
          changeSummary: { userIds: body.userIds, added: result.added },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to add cohort members');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { cohortId } = await context.params;

  const body = await parseJsonBody<CohortMembershipInput>(request);
  if (!body || !Array.isArray(body.userIds) || body.userIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'Selecciona al menos una persona' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await removeCohortMembers(client, identity, cohortId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'cohortes',
          action: 'remove_cohort_members',
          entityTable: 'app_core.cohort_memberships',
          entityId: cohortId,
          changeSummary: { userIds: body.userIds, removed: result.removed },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to remove cohort members');
  }
}
