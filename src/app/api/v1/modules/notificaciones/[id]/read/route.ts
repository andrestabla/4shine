import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { errorResponse, unauthorizedResponse } from '../../../_utils';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { id } = await params;
  try {
    await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await client.query(
          `UPDATE app_core.notifications
           SET read_at = now()
           WHERE notification_id = $1 AND user_id = $2 AND read_at IS NULL`,
          [id, identity.userId],
        );
      }),
    );
    return NextResponse.json({ ok: true, data: { ok: true } }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to mark notification as read');
  }
}
