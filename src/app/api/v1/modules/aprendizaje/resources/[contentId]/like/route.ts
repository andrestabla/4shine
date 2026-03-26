import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { toggleLearningLike } from '@/features/aprendizaje/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ contentId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { contentId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await toggleLearningLike(client, identity, contentId);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: result.liked ? 'create_learning_like' : 'delete_learning_like',
          entityTable: 'app_learning.content_likes',
          entityId: contentId,
          changeSummary: { liked: result.liked, likes: result.likes },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to toggle learning like');
  }
}
