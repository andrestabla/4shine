import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getGroupSessionAnalytics } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await getGroupSessionAnalytics(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'query_group_session_analytics',
          entityTable: 'app_mentoring.group_session_participation',
          changeSummary: { rows: result.length },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to load group session analytics');
  }
}
