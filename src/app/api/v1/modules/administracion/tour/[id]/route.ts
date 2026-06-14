import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { deleteStep, getStep, updateStep } from '@/features/tour/service';
import type { UpdateTourStepInput } from '@/features/tour/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () => getStep(client, identity, id)),
    );
    if (!data) return NextResponse.json({ ok: false, error: 'Paso no encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load tour step');
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id } = await context.params;

  const body = await parseJsonBody<UpdateTourStepInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateStep(client, identity, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_tour_step',
          entityTable: 'app_admin.tour_steps',
          entityId: id,
          changeSummary: { fields: Object.keys(body) },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update tour step');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id } = await context.params;

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await deleteStep(client, identity, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'delete_tour_step',
          entityTable: 'app_admin.tour_steps',
          entityId: id,
        });
      }),
    );
    return NextResponse.json({ ok: true, data: { deleted: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete tour step');
  }
}
