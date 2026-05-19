import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { SetFaqsInput } from '@/features/convocatorias/service';
import { setFaqs } from '@/features/convocatorias/service';
import { errorResponse, parseJsonBody, unauthorizedResponse } from '../../../_utils';

interface ContextParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ faqs: SetFaqsInput[] }>(request);
  if (!body || !Array.isArray(body.faqs)) {
    return NextResponse.json({ ok: false, error: 'faqs array is required' }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        setFaqs(client, identity, id, body.faqs),
      ),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to set FAQs');
  }
}
