import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateCommunityPostInput } from '@/features/networking/service';
import { createCommunityPost } from '@/features/networking/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ groupId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateCommunityPostInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { groupId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createCommunityPost(client, identity, groupId, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'networking',
          action: 'create_community_post',
          entityTable: 'app_networking.community_posts',
          entityId: result.postId,
          changeSummary: { groupId },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create community post');
  }
}
