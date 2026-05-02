import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { dispatchProgramMentorshipReminders } from '@/features/mentorias/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await dispatchProgramMentorshipReminders(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'mentorias',
          action: 'dispatch_program_mentorship_reminders',
          entityTable: 'app_core.notifications',
          changeSummary: { notified: result.notified },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to dispatch program mentorship reminders');
  }
}
