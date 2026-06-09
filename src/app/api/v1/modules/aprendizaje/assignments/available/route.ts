import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listAvailableAssignments } from '@/features/aprendizaje/assignments/service';
import { errorResponse, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () =>
        listAvailableAssignments(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list available assignments');
  }
}
