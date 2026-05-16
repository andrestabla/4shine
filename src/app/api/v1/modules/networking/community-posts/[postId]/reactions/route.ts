import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { toggleReaction } from '@/features/networking/service';
import { errorResponse, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ postId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { postId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, () =>
        toggleReaction(client, identity, postId),
      ),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to toggle reaction');
  }
}
