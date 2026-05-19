import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { SetDatesInput } from '@/features/convocatorias/service';
import { setDates } from '@/features/convocatorias/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ dates: SetDatesInput[] }>(request);
  if (!body || !Array.isArray(body.dates)) {
    return NextResponse.json({ ok: false, error: 'dates array is required' }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        setDates(client, identity, id, body.dates),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to set dates');
  }
}
