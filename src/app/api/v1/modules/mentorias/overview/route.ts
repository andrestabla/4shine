import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getMentorshipOverview } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getMentorshipOverview(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'query_mentorship_overview',
          entityTable: 'app_mentoring.mentorship_sessions',
          changeSummary: { role: identity.role },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load mentorship overview');
  }
}
