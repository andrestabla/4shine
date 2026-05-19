import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { reviewApplication } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ id: string; applicationId: string }>;
}

export async function PATCH(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id, applicationId } = await context.params;
  const body = await request.json() as { status: 'approved' | 'rejected'; reviewerNotes?: string };

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await reviewApplication(client, identity, id, applicationId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: `application_${body.status}`,
          entityTable: 'app_networking.convocatoria_applications',
          entityId: applicationId,
          changeSummary: { status: body.status, notes: body.reviewerNotes },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to review application');
  }
}
