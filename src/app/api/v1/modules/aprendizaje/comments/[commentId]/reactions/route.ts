import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { isLearningCommentReactionType } from '@/features/aprendizaje/comment-reactions';
import {
  toggleLearningCommentReaction,
  type ToggleLearningCommentReactionInput,
} from '@/features/aprendizaje/service';
import {
  errorResponse,
  logModuleAudit,
  parseJsonBody,
  unauthorizedResponse,
} from '../../../../_utils';

interface ContextParams {
  params: Promise<{ commentId: string }>;
}

interface ReactionBody {
  reactionType?: ToggleLearningCommentReactionInput['reactionType'];
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<ReactionBody>(request);
  const reactionType = body?.reactionType;
  if (!isLearningCommentReactionType(reactionType)) {
    return NextResponse.json(
      { ok: false, error: 'reactionType is required' },
      { status: 400 },
    );
  }

  const { commentId } = await context.params;

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await toggleLearningCommentReaction(client, identity, {
          commentId,
          reactionType,
        });
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'toggle_learning_comment_reaction',
          entityTable: 'app_learning.content_comment_reactions',
          entityId: commentId,
          changeSummary: {
            reactionType,
            reactions: result.reactions,
          },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to toggle learning comment reaction');
  }
}
