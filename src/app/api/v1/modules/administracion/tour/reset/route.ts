import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { resetTour } from '@/features/tour/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await resetTour(client, identity);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'usuarios',
          action: 'reset_tour',
          entityTable: 'app_admin.tour_settings',
          changeSummary: { newVersion: result.currentVersion },
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to reset tour');
  }
}
