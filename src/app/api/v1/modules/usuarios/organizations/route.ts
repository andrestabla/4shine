import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listOrganizations, createOrganization } from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listOrganizations(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudieron cargar las organizaciones');
  }
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const body = await parseJsonBody<{ name?: string }>(request);
  if (!body || typeof body.name !== 'string') {
    return NextResponse.json({ ok: false, error: 'Nombre inválido' }, { status: 400 });
  }
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const org = await createOrganization(client, identity, body.name as string);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'create_organization',
          entityTable: 'app_core.organizations',
          entityId: org.organizationId,
          changeSummary: { name: org.name },
        });
        return org;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'No se pudo crear la organización');
  }
}
