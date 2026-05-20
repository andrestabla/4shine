import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { errorResponse, unauthorizedResponse } from '../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await client.query(
          `UPDATE app_core.notifications
           SET read_at = now()
           WHERE user_id = $1 AND read_at IS NULL`,
          [identity.userId],
        );
      }),
    );
    return NextResponse.json({ ok: true, data: { ok: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to mark all notifications as read');
  }
}
