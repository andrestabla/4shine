import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { messageApplicants } from '@/features/convocatorias/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await context.params;
  const body = await request.json() as { applicationId?: string; subject: string; message: string };

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await messageApplicants(client, identity, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'convocatorias',
          action: 'message_applicants',
          entityTable: 'app_networking.convocatorias',
          entityId: id,
          changeSummary: { sent: result.sent, toAll: !body.applicationId },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to send message to applicants');
  }
}
