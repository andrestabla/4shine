import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { updateRolePermission } from '@/features/roles/service';
import type { UpdateRolePermissionInput } from '@/features/roles/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function PATCH(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateRolePermissionInput>(request);
  if (!body || !body.roleCode || !body.moduleCode) {
    return NextResponse.json({ ok: false, error: 'roleCode y moduleCode son obligatorios' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateRolePermission(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_role_permission',
          entityTable: 'app_auth.role_module_permissions',
          entityId: `${body.roleCode}/${body.moduleCode}`,
          changeSummary: body as unknown as Record<string, unknown>,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update role permission');
  }
}
