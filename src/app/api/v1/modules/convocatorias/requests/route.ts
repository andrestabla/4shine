import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateRequestInput } from '@/features/convocatorias/service';
import { createRequest, listRequests } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const url = new URL(request.url);
  const filter = (url.searchParams.get('filter') ?? 'pending') as 'all' | 'pending' | 'mine';

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listRequests(client, identity, filter),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list requests');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateRequestInput>(request);
  if (!body?.title) return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createRequest(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'create_convocatoria_request',
          entityTable: 'app_networking.convocatoria_requests',
          entityId: result.requestId,
          changeSummary: { title: result.title },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create request');
  }
}
