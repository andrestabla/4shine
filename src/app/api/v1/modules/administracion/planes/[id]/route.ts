import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { deletePlan, getPlanById, updatePlan } from '@/features/planes/service';
import type { UpdatePlanInput } from '@/features/planes/types';
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
      withRoleContext(client, identity.userId, identity.role, () => getPlanById(client, id)),
    );
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Plan no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load subscription plan');
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id } = await context.params;

  const body = await parseJsonBody<UpdatePlanInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updatePlan(client, identity, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_subscription_plan',
          entityTable: 'app_billing.subscription_plans',
          entityId: id,
          changeSummary: body as Record<string, unknown>,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update subscription plan');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id } = await context.params;

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await deletePlan(client, identity, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'delete_subscription_plan',
          entityTable: 'app_billing.subscription_plans',
          entityId: id,
        });
      }),
    );
    return NextResponse.json({ ok: true, data: { deleted: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete subscription plan');
  }
}
