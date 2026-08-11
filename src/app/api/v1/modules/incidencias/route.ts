import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listIncidents } from '@/features/incidencias/service';
import { errorResponse, unauthorizedResponse } from '../_utils';

/** Casos por resolver detectados sobre datos reales. Admin y gestor. */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const userId = new URL(request.url).searchParams.get('userId') || undefined;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listIncidents(client, { userId }),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list incidents');
  }
}
