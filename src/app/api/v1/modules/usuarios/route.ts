import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateUserInput, ListUsersInput } from '@/features/usuarios/service';
import { createUser, listUsers } from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const filters: ListUsersInput = {
      limit: Number(url.searchParams.get('limit') ?? 200),
      search: url.searchParams.get('search') ?? undefined,
      role: (url.searchParams.get('role') as ListUsersInput['role']) ?? undefined,
      status: (url.searchParams.get('status') as ListUsersInput['status']) ?? undefined,
      policyStatus: (url.searchParams.get('policyStatus') as ListUsersInput['policyStatus']) ?? undefined,
    };

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await listUsers(client, filters);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'query_users',
          entityTable: 'app_core.users',
          changeSummary: { ...filters } as Record<string, unknown>,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list users');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateUserInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createUser(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'create_user',
          entityTable: 'app_core.users',
          entityId: result.userId,
          changeSummary: { primaryRole: result.primaryRole },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create user');
  }
}
