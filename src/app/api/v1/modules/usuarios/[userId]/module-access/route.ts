import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { setUserModuleAccess } from '@/features/usuarios/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ userId: string }>;
}

interface ModuleAccessBody {
  moduleCode?: string;
  /** true = encender manual, false = apagar manual, null = volver al default. */
  enabled?: boolean | null;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<ModuleAccessBody>(request);
  if (!body || typeof body.moduleCode !== 'string' || !body.moduleCode.trim()) {
    return NextResponse.json({ ok: false, error: 'moduleCode requerido' }, { status: 400 });
  }
  if (body.enabled !== null && typeof body.enabled !== 'boolean') {
    return NextResponse.json({ ok: false, error: 'enabled debe ser true, false o null' }, { status: 400 });
  }

  const { userId } = await context.params;
  const moduleCode = body.moduleCode.trim();
  const enabled = body.enabled ?? null;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await setUserModuleAccess(client, identity, userId, moduleCode, enabled);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'set_user_module_access',
          entityTable: 'app_auth.user_module_access',
          entityId: userId,
          changeSummary: { moduleCode, enabled },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update user module access');
  }
}
