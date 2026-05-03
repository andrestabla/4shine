import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { followUser } from '@/features/networking/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

interface FollowBody {
  followedUserId?: string;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<FollowBody>(request);
  const followedUserId = body?.followedUserId?.trim();
  if (!followedUserId) {
    return NextResponse.json({ ok: false, error: 'followedUserId is required' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await followUser(client, identity, followedUserId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'networking',
          action: 'follow_user',
          entityTable: 'app_networking.user_follows',
          entityId: result.followedUserId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to follow user');
  }
}
