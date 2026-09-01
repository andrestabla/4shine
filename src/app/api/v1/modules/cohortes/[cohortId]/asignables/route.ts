import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listAssignableUsers } from '@/features/cohortes/service';
import { errorResponse, unauthorizedResponse } from '../../../_utils';

/** Personas de la organización que aún no están en esta cohorte. */
export async function GET(request: Request, context: { params: Promise<{ cohortId: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { cohortId } = await context.params;
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listAssignableUsers(client, identity, cohortId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list assignable users');
  }
}
