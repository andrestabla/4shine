import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { withClient, withRoleContext } from '@/server/db/pool';
import { updateLearningProgress } from '@/features/aprendizaje/service';
import { errorResponse, logModuleAudit, unauthorizedResponse } from '../../../../_utils';

interface ContextParams {
  params: Promise<{ contentId: string }>;
}

export async function POST(request: Request, context: ContextParams) {
  const identity = await authenticateRequest(request);
  if (!identity) return unauthorizedResponse();

  const { contentId } = await context.params;

  try {
    const input = await request.json();

    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const result = await updateLearningProgress(client, identity, contentId, input);
        await logModuleAudit(client, request, identity, {
          moduleCode: 'aprendizaje',
          action: 'update_learning_progress',
          entityTable: 'app_learning.content_progress',
          entityId: contentId,
        });
        return result;
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return errorResponse(error, 'Failed to update learning progress');
  }
}
