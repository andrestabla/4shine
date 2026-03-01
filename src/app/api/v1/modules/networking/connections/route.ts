import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateConnectionInput } from '@/features/networking/service';
import { createConnection, listConnections } from '@/features/networking/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 100);

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listConnections(client, identity, limit);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'networking',
          action: 'query_connections',
          entityTable: 'app_networking.connections',
          changeSummary: { limit },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list connections');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateConnectionInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createConnection(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'networking',
          action: 'contact_request',
          entityTable: 'app_networking.connections',
          entityId: result.connectionId,
          changeSummary: { status: result.status, addresseeUserId: body.addresseeUserId },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create connection');
  }
}
