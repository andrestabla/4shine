import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { deleteForumPost } from '@/features/workshops/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ workshopId: string; postId: string }>;
}

export async function DELETE(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { workshopId, postId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await deleteForumPost(client, identity, postId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'workshops',
          action: 'delete_forum_post',
          entityTable: 'app_networking.workshop_forum_posts',
          entityId: workshopId,
        });
        return result;
      }),
    );
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to delete forum post');
  }
}
