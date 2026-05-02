import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { bulkCreateMentorAvailability, type BulkMentorAvailabilityInput } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  const body = await parseJsonBody<BulkMentorAvailabilityInput>(request);
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await bulkCreateMentorAvailability(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'bulk_create_mentor_availability',
          entityTable: 'app_mentoring.mentor_availability',
          changeSummary: {
            mentorUserId: body.mentorUserId,
            fromDate: body.fromDate,
            toDate: body.toDate,
            created: result.created,
          },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to create mentor availability in bulk');
  }
}
