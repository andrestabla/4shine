import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { UpdateConvocatoriaInput } from '@/features/convocatorias/service';
import { deleteConvocatoria, getConvocatoria, updateConvocatoria } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        getConvocatoria(client, identity, id),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to get convocatoria');
  }
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<UpdateConvocatoriaInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateConvocatoria(client, identity, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'update_convocatoria',
          entityTable: 'app_networking.convocatorias',
          entityId: id,
          changeSummary: { status: result.status },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update convocatoria');
  }
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteConvocatoria(client, identity, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'delete_convocatoria',
          entityTable: 'app_networking.convocatorias',
          entityId: id,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete convocatoria');
  }
}
