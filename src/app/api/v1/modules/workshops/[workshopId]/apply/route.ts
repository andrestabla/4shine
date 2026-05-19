import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { applyToWorkshop, cancelApplication } from '@/features/workshops/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ workshopId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workshopId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await applyToWorkshop(client, identity, workshopId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'apply_workshop',
          entityTable: 'app_networking.workshop_attendees',
          entityId: workshopId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to apply to workshop');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workshopId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await cancelApplication(client, identity, workshopId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'cancel_application',
          entityTable: 'app_networking.workshop_attendees',
          entityId: workshopId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to cancel application');
  }
}
