import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateWorkshopInput } from '@/features/workshops/service';
import { deleteWorkshop, updateWorkshop } from '@/features/workshops/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface ContextParams {
  params: Promise<{ workshopId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateWorkshopInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { workshopId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateWorkshop(client, workshopId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'update_workshop',
          entityTable: 'app_networking.workshops',
          entityId: workshopId,
          changeSummary: { status: result.status },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update workshop');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workshopId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteWorkshop(client, workshopId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'delete_workshop',
          entityTable: 'app_networking.workshops',
          entityId: workshopId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete workshop');
  }
}
