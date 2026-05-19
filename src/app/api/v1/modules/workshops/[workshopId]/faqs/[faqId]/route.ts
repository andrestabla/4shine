import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { deleteFaq } from '@/features/workshops/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ workshopId: string; faqId: string }>;
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workshopId, faqId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteFaq(client, identity, faqId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'delete_faq',
          entityTable: 'app_networking.workshop_faqs',
          entityId: workshopId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete FAQ');
  }
}
