import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateConvocatoriaInput } from '@/features/convocatorias/service';
import { publishRequest } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ requestId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateConvocatoriaInput>(request);
  if (!body?.title) return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 });

  const { requestId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await publishRequest(client, identity, requestId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'publish_convocatoria_request',
          entityTable: 'app_networking.convocatorias',
          entityId: result.convocatoriaId,
          changeSummary: { requestId, title: body.title },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to publish request');
  }
}
