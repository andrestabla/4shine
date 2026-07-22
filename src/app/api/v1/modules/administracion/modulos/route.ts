import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { listModuleVisibility, updateModuleVisibility } from '@/features/modulos/service';
import type { UpdateModuleVisibilityInput } from '@/features/modulos/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

/** Catálogo de módulos/submódulos con su estado de encendido. */
export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listModuleVisibility(client, identity),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load module visibility');
  }
}

/** Enciende o apaga un módulo/submódulo para toda la plataforma. */
export async function PUT(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateModuleVisibilityInput>(request);
  if (!body || typeof body.moduleKey !== 'string' || typeof body.isEnabled !== 'boolean') {
    return NextResponse.json(
      { ok: false, error: 'moduleKey (string) e isEnabled (boolean) son requeridos' },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateModuleVisibility(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: body.isEnabled ? 'enable_module' : 'disable_module',
          entityTable: 'app_admin.module_visibility',
          entityId: body.moduleKey,
          changeSummary: { moduleKey: body.moduleKey, isEnabled: body.isEnabled },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update module visibility');
  }
}
