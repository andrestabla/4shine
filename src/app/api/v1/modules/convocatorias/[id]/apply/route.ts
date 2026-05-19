import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { applyToConvocatoria, withdrawApplication } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await context.params;

  let body: { attachmentFileUrl?: string; attachmentUrl?: string } = {};
  try {
    body = await request.json() as typeof body;
  } catch {
    // body is optional
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await applyToConvocatoria(client, identity, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'apply_convocatoria',
          entityTable: 'app_networking.convocatoria_applications',
          entityId: id,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to apply');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await withdrawApplication(client, identity, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'withdraw_convocatoria',
          entityTable: 'app_networking.convocatoria_applications',
          entityId: id,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to withdraw');
  }
}
