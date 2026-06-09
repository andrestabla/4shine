import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { requireModulePermission } from '@/server/auth/module-permissions';
import { listMentorshipPayments } from '@/features/payments/service';
import { errorResponse, unauthorizedResponse } from '../../../../modules/_utils';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();
  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, 'usuarios', 'manage');
        return listMentorshipPayments(client);
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'No se pudieron cargar los pagos de mentorías.');
  }
}
