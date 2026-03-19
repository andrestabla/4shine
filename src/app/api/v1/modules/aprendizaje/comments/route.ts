import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import type { CreateLearningCommentInput } from '@/features/aprendizaje/service';
import { createLearningComment } from '@/features/aprendizaje/service';
import { errorResponse, logModuleAudit, parseJsonBody, unauthorizedResponse } from '../../_utils';

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const body = await parseJsonBody<CreateLearningCommentInput>(request);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await createLearningComment(client, identity, body);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'create_learning_comment',
          entityTable: 'app_learning.content_comments',
          entityId: result.commentId,
          changeSummary: { contentId: result.contentId },
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Failed to create learning comment');
  }
}
