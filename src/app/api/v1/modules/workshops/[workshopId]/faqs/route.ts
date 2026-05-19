import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateFaqInput } from '@/features/workshops/service';
import { createFaq, listFaqs } from '@/features/workshops/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ workshopId: string }>;
}

export async function GET(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workshopId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        listFaqs(client, identity, workshopId),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to list FAQs');
  }
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateFaqInput>(request);
  if (!body?.question || !body?.answer) {
    return NextResponse.json({ ok: false, error: 'question and answer are required' }, { status: 400 });
  }

  const { workshopId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createFaq(client, identity, workshopId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'create_faq',
          entityTable: 'app_networking.workshop_faqs',
          entityId: workshopId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create FAQ');
  }
}
