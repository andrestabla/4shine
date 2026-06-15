import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { deleteFaq, updateFaq } from '@/features/chatbot/service';
import type { UpdateFaqInput } from '@/features/chatbot/types';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id } = await context.params;

  const body = await parseJsonBody<UpdateFaqInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateFaq(client, identity, id, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'update_chatbot_faq',
          entityTable: 'app_admin.chatbot_faqs',
          entityId: id,
          changeSummary: { fields: Object.keys(body) },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update chatbot FAQ');
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const { id } = await context.params;

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await deleteFaq(client, identity, id);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'delete_chatbot_faq',
          entityTable: 'app_admin.chatbot_faqs',
          entityId: id,
        });
      }),
    );
    return NextResponse.json({ ok: true, data: { deleted: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete chatbot FAQ');
  }
}
