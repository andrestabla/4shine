import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { dispatchGroupSessionReminders } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<{ windowType?: '14h' | '30m' }>(request);
  const windowType = body?.windowType;
  if (!windowType || (windowType !== '14h' && windowType !== '30m')) {
    return NextResponse.json({ ok: false, error: 'windowType must be 14h or 30m' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await dispatchGroupSessionReminders(client, identity, windowType);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'dispatch_group_session_reminders',
          entityTable: 'app_core.notifications',
          changeSummary: { windowType, notified: result.notified },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to dispatch group session reminders');
  }
}
