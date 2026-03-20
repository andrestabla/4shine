import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateAdditionalMentorshipOrderInput } from '@/features/mentorias/service';
import { createAdditionalMentorshipOrder } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateAdditionalMentorshipOrderInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createAdditionalMentorshipOrder(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'create_additional_mentorship_order',
          entityTable: 'app_mentoring.additional_mentorship_orders',
          entityId: result.orderId,
          changeSummary: {
            offerId: body.offerId,
            startsAt: body.startsAt,
            status: result.status,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create additional mentorship order');
  }
}
